
import { FormPanel, InputField } from './schemaParser';

interface TestDataSet {
  panels: Array<{
    title: string;
    fields: Record<string, any>;
  }>;
}

// Function to generate mock test data based on the form schema
export const generateTestData = async (
  panels: FormPanel[],
  allInputFields: InputField[],
  numberOfSets = 5
): Promise<TestDataSet[]> => {
  // In a real app, this would call an LLM API
  // For now, we'll generate some mock data locally
  
  const testSets: TestDataSet[] = [];
  
  for (let i = 0; i < numberOfSets; i++) {
    const testSet: TestDataSet = {
      panels: []
    };
    
    // Process each panel
    panels.forEach(panel => {
      const panelData: {
        title: string;
        fields: Record<string, any>;
      } = {
        title: panel.title,
        fields: {}
      };
      
      // Find input fields for this panel
      const panelInputFields = allInputFields.filter(field => 
        field.key.startsWith(`${panel.key}.`) || 
        field.key === panel.key
      );
      
      // Generate data for each field in the panel
      panelInputFields.forEach(field => {
        const fieldKey = field.key.includes('.') 
          ? field.key.split('.').pop() || field.key 
          : field.key;
          
        panelData.fields[fieldKey] = generateFieldValue(field, i);
      });
      
      testSet.panels.push(panelData);
    });
    
    testSets.push(testSet);
  }
  
  return applyConditionalLogic(testSets, allInputFields);
};

// Generate a value for a specific field based on its type
const generateFieldValue = (field: InputField, seedIndex: number): any => {
  const seed = seedIndex + 1; // Avoid zero-based seed
  
  switch (field.type) {
    case 'textfield':
    case 'textarea':
      if (field.key.toLowerCase().includes('name')) {
        const firstNames = ['John', 'Maria', 'Alex', 'Sarah', 'Michael', 'Emma', 'David', 'Sofia'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        return `${firstNames[(seed * 3) % firstNames.length]} ${lastNames[(seed * 7) % lastNames.length]}`;
      }
      if (field.key.toLowerCase().includes('email')) {
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'sfgov.org'];
        return `user${seed}@${domains[seed % domains.length]}`;
      }
      if (field.key.toLowerCase().includes('phone')) {
        return `(415) ${500 + (seed * 11) % 500}-${1000 + (seed * 13) % 9000}`;
      }
      if (field.key.toLowerCase().includes('address')) {
        const streets = ['Market St', 'Mission St', 'Van Ness Ave', 'Geary Blvd', 'California St'];
        return `${100 + (seed * 53) % 900} ${streets[seed % streets.length]}`;
      }
      if (field.key.toLowerCase().includes('city')) {
        const cities = ['San Francisco', 'Oakland', 'Berkeley', 'San Jose', 'Palo Alto'];
        return cities[seed % cities.length];
      }
      if (field.key.toLowerCase().includes('zip')) {
        return `9${4000 + (seed * 17) % 6000}`;
      }
      return `Test Value ${seed}`;
      
    case 'number':
      const min = field.validate?.min || 0;
      const max = field.validate?.max || 100;
      return min + (seed * 17) % (max - min + 1);
      
    case 'email':
      const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'sfgov.org', 'example.com'];
      return `tester${seed}@${emailDomains[seed % emailDomains.length]}`;
      
    case 'checkbox':
      return seed % 2 === 0;
      
    case 'select':
    case 'radio':
      if (field.values && field.values.length > 0) {
        return field.values[seed % field.values.length].value;
      }
      return `Option ${seed}`;
      
    case 'datetime':
      const date = new Date();
      date.setDate(date.getDate() + (seed % 30));
      return date.toISOString();
      
    case 'phoneNumber':
      return `(415) ${500 + (seed * 11) % 500}-${1000 + (seed * 13) % 9000}`;
      
    default:
      return `Value ${seed}`;
  }
};

// Apply conditional logic to test data
const applyConditionalLogic = (testSets: TestDataSet[], allInputFields: InputField[]): TestDataSet[] => {
  // Create a map of fields with conditional logic
  const conditionalFields = allInputFields.filter(field => 
    field.conditional && field.conditional.when && (field.conditional.eq !== undefined)
  );
  
  if (conditionalFields.length === 0) {
    return testSets;
  }
  
  // Process each test set to apply conditional logic
  testSets.forEach(testSet => {
    // Create a flattened view of all fields across panels
    const allFields: Record<string, any> = {};
    testSet.panels.forEach(panel => {
      Object.entries(panel.fields).forEach(([key, value]) => {
        allFields[key] = value;
      });
    });
    
    // Apply conditional logic
    conditionalFields.forEach(field => {
      if (!field.conditional?.when) return;
      
      const controlField = field.conditional.when;
      const expectedValue = field.conditional.eq;
      const fieldKey = field.key.includes('.') ? field.key.split('.').pop() || field.key : field.key;
      
      // Find which panel this field belongs to
      const panelIndex = testSet.panels.findIndex(panel => fieldKey in panel.fields);
      if (panelIndex === -1) return;
      
      // Check if the condition is met
      const controlValue = allFields[controlField];
      const conditionMet = 
        (typeof expectedValue === 'boolean' && controlValue === expectedValue) ||
        (typeof expectedValue === 'string' && String(controlValue) === expectedValue);
      
      // Show or hide the field based on the condition
      if (field.conditional.show === false && conditionMet) {
        // Remove the field if condition is met and show is false
        delete testSet.panels[panelIndex].fields[fieldKey];
      } else if (field.conditional.show === true && !conditionMet) {
        // Remove the field if condition is not met and show is true
        delete testSet.panels[panelIndex].fields[fieldKey];
      }
    });
  });
  
  return testSets;
};
