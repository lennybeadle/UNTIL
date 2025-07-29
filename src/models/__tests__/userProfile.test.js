import { describe, it, expect, beforeEach, vi } from 'vitest';
import UserProfile from '../userProfile.js';

// Mock database
const mockDb = {
  query: vi.fn(),
};

describe('UserProfile', () => {
  let userProfile;

  beforeEach(() => {
    userProfile = new UserProfile(mockDb);
    vi.clearAllMocks();
  });

  describe('validateProfile', () => {
    it('should return empty array for valid profile data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const errors = userProfile.validateProfile(validData);
      expect(errors).toEqual([]);
    });

    it('should return error for missing firstName', () => {
      const invalidData = {
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('firstName is required and must be a non-empty string');
    });

    it('should return error for empty firstName', () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('firstName is required and must be a non-empty string');
    });

    it('should return error for missing lastName', () => {
      const invalidData = {
        firstName: 'John',
        dateOfBirth: '1990-01-01',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('lastName is required and must be a non-empty string');
    });

    it('should return error for missing dateOfBirth', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('dateOfBirth is required');
    });

    it('should return error for invalid dateOfBirth', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: 'invalid-date',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('dateOfBirth must be a valid date');
    });

    it('should return error for future dateOfBirth', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: futureDate.toISOString().split('T')[0],
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toContain('dateOfBirth cannot be in the future');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        dateOfBirth: 'invalid-date',
      };

      const errors = userProfile.validateProfile(invalidData);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('firstName is required and must be a non-empty string');
      expect(errors).toContain('lastName is required and must be a non-empty string');
      expect(errors).toContain('dateOfBirth must be a valid date');
    });
  });

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      const mockProfiles = [
        { id: 1, first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', date_of_birth: '1995-05-15' },
      ];

      mockDb.query.mockResolvedValue({ rows: mockProfiles });

      const result = await userProfile.getAllProfiles();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles ORDER BY created_at DESC'
      );
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('getProfileById', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [mockProfile] });

      const result = await userProfile.getProfileById(1);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await userProfile.getProfileById(999);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM user_profiles WHERE id = $1',
        [999]
      );
      expect(result).toBeNull();
    });
  });

  describe('createProfile', () => {
    it('should create and return new profile', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const mockCreatedProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedProfile] });

      const result = await userProfile.createProfile(profileData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_profiles'),
        ['John', 'Doe', '1990-01-01']
      );
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should trim whitespace from names', async () => {
      const profileData = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        dateOfBirth: '1990-01-01',
      };

      const mockCreatedProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [mockCreatedProfile] });

      await userProfile.createProfile(profileData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_profiles'),
        ['John', 'Doe', '1990-01-01']
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile when found', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const mockUpdatedProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedProfile] });

      const result = await userProfile.updateProfile(1, profileData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_profiles'),
        ['John', 'Doe', '1990-01-01', 1]
      );
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should return null when profile not found', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await userProfile.updateProfile(999, profileData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_profiles'),
        ['John', 'Doe', '1990-01-01', 999]
      );
      expect(result).toBeNull();
    });

    it('should trim whitespace from names during update', async () => {
      const profileData = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        dateOfBirth: '1990-01-01',
      };

      const mockUpdatedProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockDb.query.mockResolvedValue({ rows: [mockUpdatedProfile] });

      await userProfile.updateProfile(1, profileData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_profiles'),
        ['John', 'Doe', '1990-01-01', 1]
      );
    });
  });
}); 