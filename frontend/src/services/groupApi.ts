import { getAuthHeaders } from '../contexts/CreditsContext';

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export interface Group {
  group_id: number;
  name: string;
  description?: string;
  invite_code: string; // Still present in backend model, but not used for joining
  created_by: number;
  created_at: string;
  is_active: boolean;
  max_members: number;
  member_count: number;
  members: GroupMember[];
}

export interface UserForGroupMember {
  user_id: number;
  username: string;
}

export interface GroupMember {
  user_id: number;
  user: UserForGroupMember; // Use nested user object
  role: 'leader' | 'member';
  joined_at: string;
}

export interface GroupChallenge {
  challenge_id: number;
  group_id: number;
  title: string;
  description?: string;
  goal_type: 'co2_reduction' | 'activity_count';
  goal_value: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_by: number;
  created_at: string;
  progress: number;
  completion_percentage: number;
}

export interface GroupRanking {
  group_id: number;
  group_name: string;
  total_co2_saved: number;
  average_co2_per_member: number;
  member_count: number;
  rank: number;
}

class GroupAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    console.log(`Fetching: ${API_URL}${endpoint}`, options);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response.json();
  }

  // Group CRUD
  async createGroup(groupData: { name: string; description?: string; max_members?: number; usernames: string[] }): Promise<Group> {
    return this.request('/groups/', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async getUserGroups(): Promise<Group[]> {
    return this.request('/groups/');
  }

  async getGroup(groupId: number): Promise<Group> {
    return this.request(`/groups/${groupId}`);
  }

  async updateGroup(groupId: number, groupData: { name?: string; description?: string; max_members?: number }): Promise<Group> {
    return this.request(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  }

  async leaveGroup(groupId: number): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async deleteGroup(groupId: number): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  // Group Challenges
  async createChallenge(groupId: number, challengeData: {
    title: string;
    description?: string;
    goal_type?: 'co2_reduction' | 'activity_count';
    goal_value: number;
    start_date: string;
    end_date: string;
  }): Promise<GroupChallenge> {
    return this.request(`/groups/${groupId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  }

  async getGroupChallenges(groupId: number): Promise<GroupChallenge[]> {
    return this.request(`/groups/${groupId}/challenges`);
  }

  async getChallenge(groupId: number, challengeId: number): Promise<GroupChallenge> {
    return this.request(`/groups/${groupId}/challenges/${challengeId}`);
  }

  async getChallengeMemberProgress(groupId: number, challengeId: number): Promise<any> {
    return this.request(`/groups/${groupId}/challenges/${challengeId}/members`);
  }

  async joinGroupChallenge(groupId: number, challengeId: number): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  }

  async getUserChallengeParticipations(groupId: number, userId: number): Promise<{ challenge_id: number; user_id: number; joined_at: string }[]> {
    return this.request(`/groups/${groupId}/challenges/participations/${userId}`);
  }

  // Rankings
  async getGlobalRanking(limit: number = 100): Promise<GroupRanking[]> {
    return this.request(`/groups/ranking?limit=${limit}`);
  }

  async getGroupRanking(groupId: number): Promise<any> {
    return this.request(`/groups/${groupId}/ranking`);
  }
}

export const groupAPI = new GroupAPI();