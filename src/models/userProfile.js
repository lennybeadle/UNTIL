class UserProfile {
    constructor(db) {
      this.db = db;
    }
  
    // Validate user profile data
    validateProfile(data) {
      const errors = [];
  
      if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
        errors.push('firstName is required and must be a non-empty string');
      }
  
      if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
        errors.push('lastName is required and must be a non-empty string');
      }
  
      if (!data.dateOfBirth) {
        errors.push('dateOfBirth is required');
      } else {
        const date = new Date(data.dateOfBirth);
        if (isNaN(date.getTime())) {
          errors.push('dateOfBirth must be a valid date');
        }
        // Check if date is not in the future
        if (date > new Date()) {
          errors.push('dateOfBirth cannot be in the future');
        }
      }
  
      return errors;
    }
  
    // Get all user profiles
    async getAllProfiles() {
      const query = 'SELECT * FROM user_profiles ORDER BY created_at DESC';
      const result = await this.db.query(query);
      return result.rows;
    }
  
    // Get a single user profile by ID
    async getProfileById(id) {
      const query = 'SELECT * FROM user_profiles WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    }
  
    // Create a new user profile
    async createProfile(profileData) {
      const query = `
        INSERT INTO user_profiles (first_name, last_name, date_of_birth)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const values = [
        profileData.firstName.trim(),
        profileData.lastName.trim(),
        profileData.dateOfBirth,
      ];
      
      const result = await this.db.query(query, values);
      return result.rows[0];
    }
  
    // Update an existing user profile
    async updateProfile(id, profileData) {
      const query = `
        UPDATE user_profiles 
        SET first_name = $1, last_name = $2, date_of_birth = $3
        WHERE id = $4
        RETURNING *
      `;
      const values = [
        profileData.firstName.trim(),
        profileData.lastName.trim(),
        profileData.dateOfBirth,
        id,
      ];
      
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    }
  }
  
  module.exports = UserProfile; 