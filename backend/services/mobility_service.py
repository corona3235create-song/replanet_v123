
import os
import json
from sqlalchemy.orm import Session
from datetime import datetime

from backend import schemas, models, crud
from backend.services.group_challenge_service import GroupChallengeService

# Constants from mobility.py
DEFAULT_CARBON_FACTORS = {
    schemas.TransportMode.WALK.value: 0,
    schemas.TransportMode.BIKE.value: 0,
    schemas.TransportMode.BUS.value: 100,
    schemas.TransportMode.SUBWAY.value: 50,
    schemas.TransportMode.CAR.value: 170,
}
CARBON_EMISSION_FACTORS_G_PER_KM = json.loads(
    os.getenv("CARBON_EMISSION_FACTORS_JSON", json.dumps(DEFAULT_CARBON_FACTORS))
)
CREDIT_PER_G_CO2 = float(os.getenv("CREDIT_PER_G_CO2", 0.1))

class MobilityService:
    @staticmethod
    def log_mobility(db: Session, log_data: schemas.MobilityLogCreate, user: models.User) -> models.MobilityLog:
        """
        Logs mobility data, creates a credit ledger entry, and updates challenge progress.
        """
        # 1. Calculate CO2 saved and points earned
        mode_emission = CARBON_EMISSION_FACTORS_G_PER_KM.get(log_data.mode.value, 0)
        car_emission_baseline = CARBON_EMISSION_FACTORS_G_PER_KM.get(schemas.TransportMode.CAR.value, 170)

        co2_saved_g = 0
        if log_data.mode in [schemas.TransportMode.WALK, schemas.TransportMode.BIKE, schemas.TransportMode.BUS, schemas.TransportMode.SUBWAY]:
            co2_saved_g = (car_emission_baseline - mode_emission) * log_data.distance_km
            if co2_saved_g < 0:
                co2_saved_g = 0
        
        points_earned = int(co2_saved_g * CREDIT_PER_G_CO2)

        # 2. Create MobilityLog entry
        db_mobility_log = models.MobilityLog(
            user_id=user.user_id,
            mode=log_data.mode,
            distance_km=log_data.distance_km,
            started_at=log_data.started_at,
            ended_at=log_data.ended_at,
            co2_baseline_g=car_emission_baseline * log_data.distance_km,
            co2_actual_g=mode_emission * log_data.distance_km,
            co2_saved_g=co2_saved_g,
            points_earned=points_earned,
            description=log_data.description,
            start_point=log_data.start_point,
            end_point=log_data.end_point,
            created_at=datetime.utcnow(),
        )
        db.add(db_mobility_log)
        db.flush() # Flush to get the log_id for the credit entry reference

        # 3. Create CreditsLedger entry
        if points_earned > 0:
            db_credit_entry = models.CreditsLedger(
                user_id=user.user_id,
                ref_log_id=db_mobility_log.log_id,
                type=schemas.CreditType.EARN,
                points=points_earned,
                reason=f"Mobility: {log_data.mode.value} for {log_data.distance_km:.2f} km",
                created_at=datetime.utcnow()
            )
            db.add(db_credit_entry)

        # 4. Update challenge progress
        if co2_saved_g > 0:
            # Update group challenges
            GroupChallengeService.update_challenge_progress(db, user_id=user.user_id, co2_saved=float(co2_saved_g))
            # Update personal challenges
            crud.update_personal_challenge_progress(db, user_id=user.user_id)

        db.commit()
        db.refresh(db_mobility_log)

        return db_mobility_log
