const UserProfile = require('../models/userProfile');

async function profileRoutes(fastify, options) {
  const userProfile = new UserProfile(fastify.db);

  // GET /profiles - Retrieve all profiles
  fastify.get('/profiles', async (request, reply) => {
    try {
      fastify.log.info('Retrieving all user profiles');
      const profiles = await userProfile.getAllProfiles();
      
      return {
        success: true,
        data: profiles,
        count: profiles.length,
      };
    } catch (error) {
      fastify.log.error('Error retrieving profiles:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // GET /profiles/:id - Retrieve a single profile
  fastify.get('/profiles/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const profileId = parseInt(id, 10);

      if (isNaN(profileId) || profileId <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid profile ID',
        });
      }

      fastify.log.info(`Retrieving profile with ID: ${profileId}`);
      const profile = await userProfile.getProfileById(profileId);

      if (!profile) {
        return reply.status(404).send({
          success: false,
          error: 'Profile not found',
        });
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      fastify.log.error('Error retrieving profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // POST /profiles - Create a new profile
  fastify.post('/profiles', async (request, reply) => {
    try {
      const profileData = request.body;

      // Validate the profile data
      const validationErrors = userProfile.validateProfile(profileData);
      if (validationErrors.length > 0) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      fastify.log.info('Creating new user profile', { firstName: profileData.firstName, lastName: profileData.lastName });
      const newProfile = await userProfile.createProfile(profileData);

      return reply.status(201).send({
        success: true,
        data: newProfile,
        message: 'Profile created successfully',
      });
    } catch (error) {
      fastify.log.error('Error creating profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // PUT /profiles/:id - Update an existing profile
  fastify.put('/profiles/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const profileId = parseInt(id, 10);
      const profileData = request.body;

      if (isNaN(profileId) || profileId <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid profile ID',
        });
      }

      // Validate the profile data
      const validationErrors = userProfile.validateProfile(profileData);
      if (validationErrors.length > 0) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      fastify.log.info(`Updating profile with ID: ${profileId}`);
      const updatedProfile = await userProfile.updateProfile(profileId, profileData);

      if (!updatedProfile) {
        return reply.status(404).send({
          success: false,
          error: 'Profile not found',
        });
      }

      return {
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      fastify.log.error('Error updating profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });
}

module.exports = profileRoutes; 