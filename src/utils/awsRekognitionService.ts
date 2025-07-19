import Config from 'react-native-config';

export interface RekognitionLabel {
  Name: string;
  Confidence: number;
  Instances?: {
    BoundingBox: {
      Width: number;
      Height: number;
      Left: number;
      Top: number;
    };
    Confidence: number;
  }[];
  Parents?: {
    Name: string;
  }[];
}

export interface RekognitionResponse {
  Labels: RekognitionLabel[];
  LabelModelVersion: string;
  ResponseMetadata: {
    RequestId: string;
    HTTPStatusCode: number;
  };
}

export interface FoodDetectionResult {
  detectedFoods: {
    name: string;
    confidence: number;
    category: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  processingTime: number;
  imageAnalysis: {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    hasFood: boolean;
    confidence: number;
  };
}

class AWSRekognitionService {
  private readonly AWS_REGION = Config.AWS_REGION || 'us-east-1';
  private readonly AWS_ACCESS_KEY_ID = Config.AWS_ACCESS_KEY_ID;
  private readonly AWS_SECRET_ACCESS_KEY = Config.AWS_SECRET_ACCESS_KEY;
  
  // Food categories mapping for better nutrition lookup
  private readonly FOOD_CATEGORIES: { [key: string]: string } = {
    // Fruits
    'Apple': 'Fruits',
    'Banana': 'Fruits',
    'Orange': 'Fruits',
    'Strawberry': 'Fruits',
    'Grapes': 'Fruits',
    'Watermelon': 'Fruits',
    'Pineapple': 'Fruits',
    'Mango': 'Fruits',
    'Peach': 'Fruits',
    'Pear': 'Fruits',
    
    // Vegetables
    'Broccoli': 'Vegetables',
    'Carrot': 'Vegetables',
    'Tomato': 'Vegetables',
    'Lettuce': 'Vegetables',
    'Spinach': 'Vegetables',
    'Bell Pepper': 'Vegetables',
    'Cucumber': 'Vegetables',
    'Onion': 'Vegetables',
    'Potato': 'Vegetables',
    'Sweet Potato': 'Vegetables',
    
    // Proteins
    'Chicken': 'Protein',
    'Beef': 'Protein',
    'Fish': 'Protein',
    'Salmon': 'Protein',
    'Egg': 'Protein',
    'Turkey': 'Protein',
    'Pork': 'Protein',
    'Shrimp': 'Protein',
    'Tofu': 'Protein',
    'Beans': 'Protein',
    
    // Grains
    'Rice': 'Grains',
    'Bread': 'Grains',
    'Pasta': 'Grains',
    'Quinoa': 'Grains',
    'Oats': 'Grains',
    'Cereal': 'Grains',
    'Noodles': 'Grains',
    
    // Dairy
    'Milk': 'Dairy',
    'Cheese': 'Dairy',
    'Yogurt': 'Dairy',
    'Butter': 'Dairy',
    'Ice Cream': 'Dairy',
    
    // Snacks & Others
    'Pizza': 'Fast Food',
    'Burger': 'Fast Food',
    'Sandwich': 'Fast Food',
    'Salad': 'Vegetables',
    'Soup': 'Mixed',
    'Cookie': 'Desserts',
    'Cake': 'Desserts',
    'Chocolate': 'Desserts',
  };

  constructor() {
    if (!this.AWS_ACCESS_KEY_ID || !this.AWS_SECRET_ACCESS_KEY) {
      console.warn('AWS credentials not configured. Food recognition will use mock data.');
    }
  }

  // Detect food items in image using AWS Rekognition
  async detectFood(imageUri: string): Promise<FoodDetectionResult> {
    const startTime = Date.now();

    try {
      // In a real implementation, you would:
      // 1. Convert image to base64 or upload to S3
      // 2. Call AWS Rekognition detectLabels API
      // 3. Filter results for food-related labels
      
      // For now, we'll simulate the AWS Rekognition response
      const mockResponse = await this.simulateRekognitionCall(imageUri);
      
      const detectedFoods = this.processFoodLabels(mockResponse.Labels);
      const processingTime = Date.now() - startTime;
      
      return {
        detectedFoods,
        processingTime,
        imageAnalysis: {
          quality: this.assessImageQuality(mockResponse.Labels),
          hasFood: detectedFoods.length > 0,
          confidence: detectedFoods.length > 0 ? Math.max(...detectedFoods.map(f => f.confidence)) : 0,
        },
      };
    } catch (error) {
      console.error('Error detecting food with AWS Rekognition:', error);
      throw new Error('Failed to analyze image with AWS Rekognition');
    }
  }

  // Simulate AWS Rekognition API call (replace with actual implementation)
  private async simulateRekognitionCall(imageUri: string): Promise<RekognitionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response based on common food recognition scenarios
    const mockLabels: RekognitionLabel[] = [
      {
        Name: 'Food',
        Confidence: 95.5,
        Parents: [],
      },
      {
        Name: 'Apple',
        Confidence: 89.2,
        Instances: [{
          BoundingBox: {
            Width: 0.3,
            Height: 0.4,
            Left: 0.35,
            Top: 0.3,
          },
          Confidence: 89.2,
        }],
        Parents: [{ Name: 'Food' }],
      },
      {
        Name: 'Fruit',
        Confidence: 87.8,
        Parents: [{ Name: 'Food' }],
      },
      {
        Name: 'Plant',
        Confidence: 82.1,
        Parents: [],
      },
    ];

    return {
      Labels: mockLabels,
      LabelModelVersion: '2.0',
      ResponseMetadata: {
        RequestId: 'mock-request-id',
        HTTPStatusCode: 200,
      },
    };
  }

  // Process Rekognition labels to extract food items
  private processFoodLabels(labels: RekognitionLabel[]): FoodDetectionResult['detectedFoods'] {
    const foodItems: FoodDetectionResult['detectedFoods'] = [];
    const processedNames = new Set<string>();

    // Filter for food-related labels with high confidence
    const foodLabels = labels.filter(label => 
      label.Confidence > 70 && 
      (this.isFoodLabel(label.Name) || this.hasFoodParent(label))
    );

    for (const label of foodLabels) {
      const foodName = this.normalizeFoodName(label.Name);
      
      // Avoid duplicates
      if (processedNames.has(foodName)) continue;
      processedNames.add(foodName);

      // Skip generic labels if we have specific ones
      if (this.isGenericFoodLabel(foodName) && this.hasSpecificFoodLabels(foodLabels)) {
        continue;
      }

      const category = this.getFoodCategory(foodName);
      let boundingBox;

      // Extract bounding box if available
      if (label.Instances && label.Instances.length > 0) {
        const instance = label.Instances[0];
        boundingBox = {
          x: instance.BoundingBox.Left,
          y: instance.BoundingBox.Top,
          width: instance.BoundingBox.Width,
          height: instance.BoundingBox.Height,
        };
      }

      foodItems.push({
        name: foodName,
        confidence: label.Confidence / 100, // Convert to 0-1 scale
        category,
        boundingBox,
      });
    }

    // Sort by confidence (highest first)
    return foodItems.sort((a, b) => b.confidence - a.confidence);
  }

  // Check if label represents food
  private isFoodLabel(labelName: string): boolean {
    const foodKeywords = [
      'apple', 'banana', 'orange', 'strawberry', 'grapes', 'watermelon',
      'broccoli', 'carrot', 'tomato', 'lettuce', 'spinach', 'pepper',
      'chicken', 'beef', 'fish', 'salmon', 'egg', 'turkey',
      'rice', 'bread', 'pasta', 'quinoa', 'oats', 'cereal',
      'milk', 'cheese', 'yogurt', 'pizza', 'burger', 'sandwich',
      'salad', 'soup', 'cookie', 'cake', 'chocolate'
    ];

    return foodKeywords.some(keyword => 
      labelName.toLowerCase().includes(keyword)
    );
  }

  // Check if label has food-related parent
  private hasFoodParent(label: RekognitionLabel): boolean {
    if (!label.Parents) return false;
    
    const foodParents = ['Food', 'Fruit', 'Vegetable', 'Meat', 'Dairy', 'Grain'];
    return label.Parents.some(parent => 
      foodParents.includes(parent.Name)
    );
  }

  // Normalize food name for consistency
  private normalizeFoodName(name: string): string {
    // Remove common suffixes and normalize
    return name
      .replace(/\s+(Food|Item|Product)$/i, '')
      .replace(/^(Fresh|Organic|Raw|Cooked)\s+/i, '')
      .trim();
  }

  // Check if label is generic (like "Food", "Fruit")
  private isGenericFoodLabel(name: string): boolean {
    const genericLabels = ['Food', 'Fruit', 'Vegetable', 'Meat', 'Dairy', 'Grain', 'Plant'];
    return genericLabels.includes(name);
  }

  // Check if we have specific food labels
  private hasSpecificFoodLabels(labels: RekognitionLabel[]): boolean {
    return labels.some(label => 
      !this.isGenericFoodLabel(label.Name) && 
      this.isFoodLabel(label.Name)
    );
  }

  // Get food category
  private getFoodCategory(foodName: string): string {
    return this.FOOD_CATEGORIES[foodName] || 'Other';
  }

  // Assess image quality based on labels
  private assessImageQuality(labels: RekognitionLabel[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const maxConfidence = Math.max(...labels.map(l => l.Confidence));
    const foodLabels = labels.filter(l => this.isFoodLabel(l.Name) || this.hasFoodParent(l));

    if (maxConfidence > 90 && foodLabels.length >= 2) {
      return 'excellent';
    } else if (maxConfidence > 80 && foodLabels.length >= 1) {
      return 'good';
    } else if (maxConfidence > 70) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  // Get detailed food information (would typically call nutrition API)
  async getFoodNutritionInfo(foodName: string): Promise<any> {
    // In a real implementation, this would call a nutrition database API
    // For now, return mock data
    const mockNutrition = {
      name: foodName,
      nutritionPer100g: {
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        fiber: 2.4,
        sugar: 10,
        sodium: 1,
      },
      commonPortions: [
        { name: 'Medium', weight: 150 },
        { name: 'Large', weight: 200 },
        { name: 'Small', weight: 100 },
      ],
    };

    return mockNutrition;
  }

  // Batch process multiple images
  async batchDetectFood(imageUris: string[]): Promise<FoodDetectionResult[]> {
    const results = await Promise.all(
      imageUris.map(uri => this.detectFood(uri))
    );
    return results;
  }

  // Get confidence threshold recommendations
  getConfidenceThresholds(): {
    high: number;
    medium: number;
    low: number;
  } {
    return {
      high: 0.85, // 85% confidence
      medium: 0.70, // 70% confidence
      low: 0.50, // 50% confidence
    };
  }

  // Validate AWS configuration
  isConfigured(): boolean {
    return !!(this.AWS_ACCESS_KEY_ID && this.AWS_SECRET_ACCESS_KEY);
  }
}

export default new AWSRekognitionService();

