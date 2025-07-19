import { NutriScanError, ERROR_CODES, createValidationError } from './errorHandler';
import { UserProfile, NutritionGoals, FoodEntry } from '../types';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedValue?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  POSITIVE_NUMBER: /^\d*\.?\d+$/,
  INTEGER: /^\d+$/,
  DECIMAL: /^\d*\.?\d*$/,
} as const;

// Validation constraints
export const VALIDATION_CONSTRAINTS = {
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 8,
    AGE_MIN: 13,
    AGE_MAX: 120,
    HEIGHT_MIN: 50, // cm
    HEIGHT_MAX: 300, // cm
    WEIGHT_MIN: 20, // kg
    WEIGHT_MAX: 500, // kg
  },
  NUTRITION: {
    CALORIES_MIN: 0,
    CALORIES_MAX: 10000,
    MACRO_MIN: 0,
    MACRO_MAX: 1000,
    WATER_MIN: 0,
    WATER_MAX: 10000, // ml
  },
  FOOD: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    PORTION_MIN: 0.1,
    PORTION_MAX: 10000,
    QUANTITY_MIN: 0.01,
    QUANTITY_MAX: 100,
  },
} as const;

// Base validator class
class Validator {
  // Validate a single field
  validateField(value: any, rules: ValidationRule, fieldName: string): ValidationResult {
    const errors: ValidationError[] = [];
    let sanitizedValue = value;

    // Required validation
    if (rules.required && this.isEmpty(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      });
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return { isValid: true, errors: [], sanitizedValue };
    }

    // String validations
    if (typeof value === 'string') {
      sanitizedValue = this.sanitizeString(value);

      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.minLength} characters`,
          code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        });
      }

      if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must not exceed ${rules.maxLength} characters`,
          code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        });
      }

      if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        });
      }
    }

    // Number validations
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const numValue = Number(value);
      sanitizedValue = numValue;

      if (rules.min !== undefined && numValue < rules.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.min}`,
          code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        });
      }

      if (rules.max !== undefined && numValue > rules.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must not exceed ${rules.max}`,
          code: ERROR_CODES.VALIDATION_OUT_OF_RANGE,
        });
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(sanitizedValue);
      if (customResult !== true) {
        errors.push({
          field: fieldName,
          message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`,
          code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  // Validate multiple fields
  validateObject(obj: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
    const allErrors: ValidationError[] = [];
    const sanitizedObject: Record<string, any> = {};

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const fieldValue = obj[fieldName];
      const result = this.validateField(fieldValue, fieldRules, fieldName);
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
      } else {
        sanitizedObject[fieldName] = result.sanitizedValue;
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      sanitizedValue: sanitizedObject,
    };
  }

  // Check if value is empty
  private isEmpty(value: any): boolean {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  // Sanitize string input
  private sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }
}

// Create validator instance
const validator = new Validator();

// Specific validation functions
export const validateEmail = (email: string): ValidationResult => {
  return validator.validateField(email, {
    required: true,
    pattern: VALIDATION_PATTERNS.EMAIL,
    maxLength: 254,
  }, 'email');
};

export const validatePassword = (password: string): ValidationResult => {
  return validator.validateField(password, {
    required: true,
    minLength: VALIDATION_CONSTRAINTS.USER.PASSWORD_MIN_LENGTH,
    pattern: VALIDATION_PATTERNS.PASSWORD,
    custom: (value: string) => {
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      return true;
    },
  }, 'password');
};

export const validateName = (name: string): ValidationResult => {
  return validator.validateField(name, {
    required: true,
    minLength: VALIDATION_CONSTRAINTS.USER.NAME_MIN_LENGTH,
    maxLength: VALIDATION_CONSTRAINTS.USER.NAME_MAX_LENGTH,
    pattern: VALIDATION_PATTERNS.NAME,
  }, 'name');
};

export const validateAge = (age: number): ValidationResult => {
  return validator.validateField(age, {
    required: true,
    min: VALIDATION_CONSTRAINTS.USER.AGE_MIN,
    max: VALIDATION_CONSTRAINTS.USER.AGE_MAX,
  }, 'age');
};

export const validateHeight = (height: number): ValidationResult => {
  return validator.validateField(height, {
    required: true,
    min: VALIDATION_CONSTRAINTS.USER.HEIGHT_MIN,
    max: VALIDATION_CONSTRAINTS.USER.HEIGHT_MAX,
  }, 'height');
};

export const validateWeight = (weight: number): ValidationResult => {
  return validator.validateField(weight, {
    required: true,
    min: VALIDATION_CONSTRAINTS.USER.WEIGHT_MIN,
    max: VALIDATION_CONSTRAINTS.USER.WEIGHT_MAX,
  }, 'weight');
};

export const validateCalories = (calories: number): ValidationResult => {
  return validator.validateField(calories, {
    required: true,
    min: VALIDATION_CONSTRAINTS.NUTRITION.CALORIES_MIN,
    max: VALIDATION_CONSTRAINTS.NUTRITION.CALORIES_MAX,
  }, 'calories');
};

export const validateMacronutrient = (value: number, name: string): ValidationResult => {
  return validator.validateField(value, {
    required: true,
    min: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MIN,
    max: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MAX,
  }, name);
};

export const validateFoodName = (name: string): ValidationResult => {
  return validator.validateField(name, {
    required: true,
    minLength: VALIDATION_CONSTRAINTS.FOOD.NAME_MIN_LENGTH,
    maxLength: VALIDATION_CONSTRAINTS.FOOD.NAME_MAX_LENGTH,
    custom: (value: string) => {
      // Check for potentially harmful content
      const harmfulPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
      if (harmfulPatterns.some(pattern => pattern.test(value))) {
        return 'Food name contains invalid characters';
      }
      return true;
    },
  }, 'food name');
};

export const validatePortion = (portion: number): ValidationResult => {
  return validator.validateField(portion, {
    required: true,
    min: VALIDATION_CONSTRAINTS.FOOD.PORTION_MIN,
    max: VALIDATION_CONSTRAINTS.FOOD.PORTION_MAX,
  }, 'portion');
};

export const validateQuantity = (quantity: number): ValidationResult => {
  return validator.validateField(quantity, {
    required: true,
    min: VALIDATION_CONSTRAINTS.FOOD.QUANTITY_MIN,
    max: VALIDATION_CONSTRAINTS.FOOD.QUANTITY_MAX,
  }, 'quantity');
};

// Complex object validations
export const validateUserProfile = (profile: Partial<UserProfile>): ValidationResult => {
  const rules: Record<string, ValidationRule> = {
    age: {
      min: VALIDATION_CONSTRAINTS.USER.AGE_MIN,
      max: VALIDATION_CONSTRAINTS.USER.AGE_MAX,
    },
    height: {
      min: VALIDATION_CONSTRAINTS.USER.HEIGHT_MIN,
      max: VALIDATION_CONSTRAINTS.USER.HEIGHT_MAX,
    },
    weight: {
      min: VALIDATION_CONSTRAINTS.USER.WEIGHT_MIN,
      max: VALIDATION_CONSTRAINTS.USER.WEIGHT_MAX,
    },
    activityLevel: {
      required: true,
      custom: (value: string) => {
        const validLevels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'];
        return validLevels.includes(value) || 'Invalid activity level';
      },
    },
    gender: {
      custom: (value: string) => {
        if (!value) return true; // Optional field
        const validGenders = ['male', 'female', 'other'];
        return validGenders.includes(value) || 'Invalid gender';
      },
    },
  };

  return validator.validateObject(profile, rules);
};

export const validateNutritionGoals = (goals: Partial<NutritionGoals>): ValidationResult => {
  const rules: Record<string, ValidationRule> = {
    dailyCalories: {
      required: true,
      min: VALIDATION_CONSTRAINTS.NUTRITION.CALORIES_MIN,
      max: VALIDATION_CONSTRAINTS.NUTRITION.CALORIES_MAX,
    },
    protein: {
      required: true,
      min: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MIN,
      max: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MAX,
    },
    carbs: {
      required: true,
      min: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MIN,
      max: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MAX,
    },
    fat: {
      required: true,
      min: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MIN,
      max: VALIDATION_CONSTRAINTS.NUTRITION.MACRO_MAX,
    },
    water: {
      required: true,
      min: VALIDATION_CONSTRAINTS.NUTRITION.WATER_MIN,
      max: VALIDATION_CONSTRAINTS.NUTRITION.WATER_MAX,
    },
    goalType: {
      required: true,
      custom: (value: string) => {
        const validTypes = ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'];
        return validTypes.includes(value) || 'Invalid goal type';
      },
    },
  };

  return validator.validateObject(goals, rules);
};

export const validateFoodEntry = (entry: Partial<FoodEntry>): ValidationResult => {
  const rules: Record<string, ValidationRule> = {
    quantity: {
      required: true,
      min: VALIDATION_CONSTRAINTS.FOOD.QUANTITY_MIN,
      max: VALIDATION_CONSTRAINTS.FOOD.QUANTITY_MAX,
    },
    source: {
      required: true,
      custom: (value: string) => {
        const validSources = ['scan', 'manual', 'barcode', 'voice', 'quick_add'];
        return validSources.includes(value) || 'Invalid food entry source';
      },
    },
  };

  return validator.validateObject(entry, rules);
};

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 100);
};

// Validation error helper
export const throwValidationError = (result: ValidationResult): never => {
  const firstError = result.errors[0];
  throw createValidationError(firstError.field, firstError.message);
};

// Validation middleware for forms
export const createFormValidator = (rules: Record<string, ValidationRule>) => {
  return (values: Record<string, any>): Record<string, string> => {
    const result = validator.validateObject(values, rules);
    const errors: Record<string, string> = {};
    
    result.errors.forEach(error => {
      errors[error.field] = error.message;
    });
    
    return errors;
  };
};

export default validator;

