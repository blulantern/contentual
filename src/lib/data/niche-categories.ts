import { NicheCategory } from '@/types/profile';

export const NICHE_CATEGORIES: NicheCategory[] = [
  // Lifestyle & Personal
  { id: 1, name: 'Daily Vlogging', category: 'Lifestyle' },
  { id: 2, name: 'Morning Routines', category: 'Lifestyle' },
  { id: 3, name: 'Self-Improvement', category: 'Lifestyle' },
  { id: 4, name: 'Productivity', category: 'Lifestyle' },
  { id: 5, name: 'Minimalism', category: 'Lifestyle' },
  { id: 6, name: 'Organization & Cleaning', category: 'Lifestyle' },
  { id: 7, name: 'Home Decor', category: 'Lifestyle' },
  { id: 8, name: 'Interior Design', category: 'Lifestyle' },
  { id: 9, name: 'Sustainable Living', category: 'Lifestyle' },
  { id: 10, name: 'Zero Waste', category: 'Lifestyle' },

  // Beauty & Fashion
  { id: 11, name: 'Makeup Tutorials', category: 'Beauty' },
  { id: 12, name: 'Skincare Routines', category: 'Beauty' },
  { id: 13, name: 'Hair Styling', category: 'Beauty' },
  { id: 14, name: 'Fashion Hauls', category: 'Fashion' },
  { id: 15, name: 'Outfit Ideas', category: 'Fashion' },
  { id: 16, name: 'Sustainable Fashion', category: 'Fashion' },
  { id: 17, name: 'Thrift Flips', category: 'Fashion' },
  { id: 18, name: 'Plus-Size Fashion', category: 'Fashion' },
  { id: 19, name: 'Luxury Fashion', category: 'Fashion' },
  { id: 20, name: 'Streetwear', category: 'Fashion' },

  // Food & Cooking
  { id: 21, name: 'Recipe Videos', category: 'Food' },
  { id: 22, name: 'Baking', category: 'Food' },
  { id: 23, name: 'Vegan Cooking', category: 'Food' },
  { id: 24, name: 'Healthy Meals', category: 'Food' },
  { id: 25, name: 'Meal Prep', category: 'Food' },
  { id: 26, name: 'Food Reviews', category: 'Food' },
  { id: 27, name: 'Restaurant Reviews', category: 'Food' },
  { id: 28, name: 'Cooking Hacks', category: 'Food' },
  { id: 29, name: 'Desserts', category: 'Food' },
  { id: 30, name: 'International Cuisine', category: 'Food' },

  // Fitness & Health
  { id: 31, name: 'Workout Routines', category: 'Fitness' },
  { id: 32, name: 'Yoga', category: 'Fitness' },
  { id: 33, name: 'Weight Loss Journey', category: 'Fitness' },
  { id: 34, name: 'Bodybuilding', category: 'Fitness' },
  { id: 35, name: 'Home Workouts', category: 'Fitness' },
  { id: 36, name: 'Running', category: 'Fitness' },
  { id: 37, name: 'Mental Health', category: 'Health' },
  { id: 38, name: 'Meditation', category: 'Health' },
  { id: 39, name: 'Nutrition', category: 'Health' },
  { id: 40, name: 'Wellness', category: 'Health' },

  // Technology
  { id: 41, name: 'Tech Reviews', category: 'Technology' },
  { id: 42, name: 'Smartphone Reviews', category: 'Technology' },
  { id: 43, name: 'Gadget Unboxing', category: 'Technology' },
  { id: 44, name: 'PC Building', category: 'Technology' },
  { id: 45, name: 'Software Tutorials', category: 'Technology' },
  { id: 46, name: 'Web Development', category: 'Technology' },
  { id: 47, name: 'App Development', category: 'Technology' },
  { id: 48, name: 'AI & Machine Learning', category: 'Technology' },
  { id: 49, name: 'Cybersecurity', category: 'Technology' },
  { id: 50, name: 'Tech News', category: 'Technology' },

  // Gaming
  { id: 51, name: 'Gaming Let\'s Plays', category: 'Gaming' },
  { id: 52, name: 'Game Reviews', category: 'Gaming' },
  { id: 53, name: 'Speedruns', category: 'Gaming' },
  { id: 54, name: 'Gaming Tips & Tricks', category: 'Gaming' },
  { id: 55, name: 'eSports', category: 'Gaming' },
  { id: 56, name: 'Retro Gaming', category: 'Gaming' },
  { id: 57, name: 'Mobile Gaming', category: 'Gaming' },
  { id: 58, name: 'Game Streaming', category: 'Gaming' },
  { id: 59, name: 'Gaming Setup Tours', category: 'Gaming' },
  { id: 60, name: 'Game Development', category: 'Gaming' },

  // Education
  { id: 61, name: 'Study Tips', category: 'Education' },
  { id: 62, name: 'Language Learning', category: 'Education' },
  { id: 63, name: 'Math Tutorials', category: 'Education' },
  { id: 64, name: 'Science Explanations', category: 'Education' },
  { id: 65, name: 'History Lessons', category: 'Education' },
  { id: 66, name: 'Book Reviews', category: 'Education' },
  { id: 67, name: 'Educational Kids Content', category: 'Education' },
  { id: 68, name: 'Test Prep', category: 'Education' },
  { id: 69, name: 'Career Advice', category: 'Education' },
  { id: 70, name: 'Online Courses', category: 'Education' },

  // Business & Finance
  { id: 71, name: 'Entrepreneurship', category: 'Business' },
  { id: 72, name: 'Side Hustles', category: 'Business' },
  { id: 73, name: 'Stock Market', category: 'Finance' },
  { id: 74, name: 'Cryptocurrency', category: 'Finance' },
  { id: 75, name: 'Personal Finance', category: 'Finance' },
  { id: 76, name: 'Budgeting', category: 'Finance' },
  { id: 77, name: 'Real Estate', category: 'Finance' },
  { id: 78, name: 'Investing', category: 'Finance' },
  { id: 79, name: 'Marketing', category: 'Business' },
  { id: 80, name: 'Social Media Strategy', category: 'Business' },

  // Entertainment
  { id: 81, name: 'Comedy Skits', category: 'Entertainment' },
  { id: 82, name: 'Pranks', category: 'Entertainment' },
  { id: 83, name: 'Reaction Videos', category: 'Entertainment' },
  { id: 84, name: 'Challenges', category: 'Entertainment' },
  { id: 85, name: 'Movie Reviews', category: 'Entertainment' },
  { id: 86, name: 'TV Show Recaps', category: 'Entertainment' },
  { id: 87, name: 'Celebrity News', category: 'Entertainment' },
  { id: 88, name: 'Music Covers', category: 'Entertainment' },
  { id: 89, name: 'Original Music', category: 'Entertainment' },
  { id: 90, name: 'Dance', category: 'Entertainment' },

  // Creative & Arts
  { id: 91, name: 'Drawing Tutorials', category: 'Creative' },
  { id: 92, name: 'Painting', category: 'Creative' },
  { id: 93, name: 'Digital Art', category: 'Creative' },
  { id: 94, name: 'Photography', category: 'Creative' },
  { id: 95, name: 'Video Editing', category: 'Creative' },
  { id: 96, name: 'Graphic Design', category: 'Creative' },
  { id: 97, name: 'Animation', category: 'Creative' },
  { id: 98, name: 'Crafts & DIY', category: 'Creative' },
  { id: 99, name: 'Woodworking', category: 'Creative' },
  { id: 100, name: 'Pottery', category: 'Creative' },

  // Family & Parenting
  { id: 101, name: 'Pregnancy Journey', category: 'Family' },
  { id: 102, name: 'Parenting Tips', category: 'Family' },
  { id: 103, name: 'Kids Activities', category: 'Family' },
  { id: 104, name: 'Family Vlogs', category: 'Family' },
  { id: 105, name: 'Homeschooling', category: 'Family' },
  { id: 106, name: 'Baby Products', category: 'Family' },
  { id: 107, name: 'Kids Toys Reviews', category: 'Family' },
  { id: 108, name: 'Mom Life', category: 'Family' },
  { id: 109, name: 'Dad Life', category: 'Family' },
  { id: 110, name: 'Adoption Journey', category: 'Family' },

  // Travel
  { id: 111, name: 'Travel Vlogs', category: 'Travel' },
  { id: 112, name: 'Budget Travel', category: 'Travel' },
  { id: 113, name: 'Luxury Travel', category: 'Travel' },
  { id: 114, name: 'Travel Tips', category: 'Travel' },
  { id: 115, name: 'Digital Nomad', category: 'Travel' },
  { id: 116, name: 'Van Life', category: 'Travel' },
  { id: 117, name: 'Backpacking', category: 'Travel' },
  { id: 118, name: 'Food Tourism', category: 'Travel' },
  { id: 119, name: 'Solo Travel', category: 'Travel' },
  { id: 120, name: 'Adventure Travel', category: 'Travel' },

  // Pets & Animals
  { id: 121, name: 'Pet Care', category: 'Pets' },
  { id: 122, name: 'Dog Training', category: 'Pets' },
  { id: 123, name: 'Cat Videos', category: 'Pets' },
  { id: 124, name: 'Exotic Pets', category: 'Pets' },
  { id: 125, name: 'Pet Grooming', category: 'Pets' },
  { id: 126, name: 'Wildlife', category: 'Animals' },
  { id: 127, name: 'Animal Rescue', category: 'Animals' },
  { id: 128, name: 'Aquarium', category: 'Pets' },
  { id: 129, name: 'Birds', category: 'Pets' },
  { id: 130, name: 'Reptiles', category: 'Pets' },

  // Sports
  { id: 131, name: 'Football/Soccer', category: 'Sports' },
  { id: 132, name: 'Basketball', category: 'Sports' },
  { id: 133, name: 'Baseball', category: 'Sports' },
  { id: 134, name: 'Tennis', category: 'Sports' },
  { id: 135, name: 'Golf', category: 'Sports' },
  { id: 136, name: 'Combat Sports', category: 'Sports' },
  { id: 137, name: 'Extreme Sports', category: 'Sports' },
  { id: 138, name: 'Sports Commentary', category: 'Sports' },
  { id: 139, name: 'Sports Highlights', category: 'Sports' },
  { id: 140, name: 'Sports News', category: 'Sports' },

  // Automotive
  { id: 141, name: 'Car Reviews', category: 'Automotive' },
  { id: 142, name: 'Car Modifications', category: 'Automotive' },
  { id: 143, name: 'Car Maintenance', category: 'Automotive' },
  { id: 144, name: 'Luxury Cars', category: 'Automotive' },
  { id: 145, name: 'Classic Cars', category: 'Automotive' },
  { id: 146, name: 'Motorcycles', category: 'Automotive' },
  { id: 147, name: 'Electric Vehicles', category: 'Automotive' },
];

export const getNicheCategoriesText = (): string => {
  const grouped = NICHE_CATEGORIES.reduce((acc, niche) => {
    const category = niche.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(`${niche.id}. ${niche.name}`);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped)
    .map(([category, niches]) => `${category}:\n${niches.join('\n')}`)
    .join('\n\n');
};

export const getNicheById = (id: number): NicheCategory | undefined => {
  return NICHE_CATEGORIES.find((n) => n.id === id);
};

export const getNicheByName = (name: string): NicheCategory | undefined => {
  return NICHE_CATEGORIES.find((n) => n.name.toLowerCase() === name.toLowerCase());
};

export const getNichesByCategory = (category: string): NicheCategory[] => {
  return NICHE_CATEGORIES.filter((n) => n.category === category);
};
