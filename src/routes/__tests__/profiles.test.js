import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fastify from 'fastify';

// Mock UserProfile model
vi.mock('../../models/userProfile.js', () => {
  const mockUserProfileInstance = {
    validateProfile: vi.fn(),
    getAllProfiles: vi.fn(),
    getProfileById: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
  };

  const mockUserProfileConstructor = vi
    .fn()
    .mockImplementation(() => mockUserProfileInstance);

  return {
    default: mockUserProfileConstructor,
  };
});

// Import after mocking
import profileRoutes from '../profiles.js';

// Get the mocked instance
import UserProfile from '../../models/userProfile.js';
const mockUserProfileInstance = new UserProfile();

describe('Profile Routes', () => {
  let app;

  beforeEach(async () => {
    app = fastify();

    // Mock database
    app.decorate('db', { query: vi.fn() });

    // Register routes
    await app.register(profileRoutes);

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /profiles', () => {
    it('should return all profiles successfully', async () => {
      const mockProfiles = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          date_of_birth: '1995-05-15',
        },
      ];

      mockUserProfileInstance.getAllProfiles.mockResolvedValue(mockProfiles);

      const response = await app.inject({
        method: 'GET',
        url: '/profiles',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        success: true,
        data: mockProfiles,
        count: 2,
      });
      expect(mockUserProfileInstance.getAllProfiles).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockUserProfileInstance.getAllProfiles.mockRejectedValue(
        new Error('Database error')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/profiles',
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('GET /profiles/:id', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      };

      mockUserProfileInstance.getProfileById.mockResolvedValue(mockProfile);

      const response = await app.inject({
        method: 'GET',
        url: '/profiles/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        success: true,
        data: mockProfile,
      });
      expect(mockUserProfileInstance.getProfileById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when profile not found', async () => {
      mockUserProfileInstance.getProfileById.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/profiles/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Profile not found',
      });
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/profiles/invalid',
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Invalid profile ID',
      });
    });

    it('should return 400 for negative ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/profiles/-1',
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Invalid profile ID',
      });
    });
  });

  describe('POST /profiles', () => {
    it('should create profile successfully', async () => {
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

      mockUserProfileInstance.validateProfile.mockReturnValue([]);
      mockUserProfileInstance.createProfile.mockResolvedValue(
        mockCreatedProfile
      );

      const response = await app.inject({
        method: 'POST',
        url: '/profiles',
        payload: profileData,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual({
        success: true,
        data: mockCreatedProfile,
        message: 'Profile created successfully',
      });
      expect(mockUserProfileInstance.validateProfile).toHaveBeenCalledWith(
        profileData
      );
      expect(mockUserProfileInstance.createProfile).toHaveBeenCalledWith(
        profileData
      );
    });

    it('should return 400 for invalid data', async () => {
      const profileData = {
        firstName: '',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const validationErrors = [
        'firstName is required and must be a non-empty string',
      ];
      mockUserProfileInstance.validateProfile.mockReturnValue(validationErrors);

      const response = await app.inject({
        method: 'POST',
        url: '/profiles',
        payload: profileData,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
    });

    it('should handle database errors', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      mockUserProfileInstance.validateProfile.mockReturnValue([]);
      mockUserProfileInstance.createProfile.mockRejectedValue(
        new Error('Database error')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/profiles',
        payload: profileData,
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('PUT /profiles/:id', () => {
    it('should update profile successfully', async () => {
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

      mockUserProfileInstance.validateProfile.mockReturnValue([]);
      mockUserProfileInstance.updateProfile.mockResolvedValue(
        mockUpdatedProfile
      );

      const response = await app.inject({
        method: 'PUT',
        url: '/profiles/1',
        payload: profileData,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        success: true,
        data: mockUpdatedProfile,
        message: 'Profile updated successfully',
      });
      expect(mockUserProfileInstance.validateProfile).toHaveBeenCalledWith(
        profileData
      );
      expect(mockUserProfileInstance.updateProfile).toHaveBeenCalledWith(
        1,
        profileData
      );
    });

    it('should return 404 when profile not found', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      mockUserProfileInstance.validateProfile.mockReturnValue([]);
      mockUserProfileInstance.updateProfile.mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/profiles/999',
        payload: profileData,
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Profile not found',
      });
    });

    it('should return 400 for invalid ID', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/profiles/invalid',
        payload: profileData,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Invalid profile ID',
      });
    });

    it('should return 400 for invalid data', async () => {
      const profileData = {
        firstName: '',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const validationErrors = [
        'firstName is required and must be a non-empty string',
      ];
      mockUserProfileInstance.validateProfile.mockReturnValue(validationErrors);

      const response = await app.inject({
        method: 'PUT',
        url: '/profiles/1',
        payload: profileData,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
    });
  });
});
