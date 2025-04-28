
export interface FormPanel {
  title: string;
  key: string;
  components: any[];
}

export interface InputField {
  key: string;
  label: string;
  type: string;
  conditional?: {
    show?: boolean;
    when?: string;
    eq?: string | boolean;
  };
  validate?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  values?: Array<{ label: string; value: string }>;
  data?: {
    values?: Array<{ label: string; value: string }>;
  };
  multiple?: boolean;
}

/**
 * Parse form.io schema and extract panels and input fields
 */
export const parseFormSchema = (schema: any): { panels: FormPanel[], allInputFields: InputField[] } => {
  try {
    // If the schema has components, it's a form.io schema
    if (!schema || !schema.components) {
      throw new Error("Invalid form.io schema: Missing components array");
    }

    const panels: FormPanel[] = [];
    const allInputFields: InputField[] = [];
    
    // Find all panels in the schema
    const findPanels = (components: any[], parentKey = ''): void => {
      components.forEach(component => {
        if (component.type === 'panel') {
          panels.push({
            title: component.title || 'Unnamed Panel',
            key: component.key,
            components: component.components || []
          });
          
          // Process components inside the panel
          if (component.components) {
            extractInputFields(component.components, component.key, allInputFields);
          }
        } else if (component.components) {
          // Recursively search for panels in nested components
          findPanels(component.components, component.key);
        } else if (isInputField(component)) {
          // If there are input fields not in a panel, still capture them
          allInputFields.push(formatInputField(component, parentKey));
        }
      });
    };
    
    findPanels(schema.components);
    
    // If no panels were found, create a default panel with all input fields
    if (panels.length === 0) {
      const defaultPanel: FormPanel = {
        title: 'Form Data',
        key: 'defaultPanel',
        components: []
      };
      
      // Extract all input fields directly from the schema
      extractInputFields(schema.components, defaultPanel.key, allInputFields);
      defaultPanel.components = schema.components.filter(isInputField);
      panels.push(defaultPanel);
    }
    
    return { panels, allInputFields };
  } catch (error) {
    console.error("Error parsing form schema:", error);
    return { panels: [], allInputFields: [] };
  }
};

/**
 * Check if a component is an input field
 */
const isInputField = (component: any): boolean => {
  const inputTypes = [
    'textfield', 'textarea', 'number', 'password', 'email', 
    'checkbox', 'selectboxes', 'select', 'radio', 'datetime',
    'day', 'time', 'phoneNumber', 'address', 'signature'
  ];
  
  return inputTypes.includes(component.type);
};

/**
 * Format an input field with the necessary properties
 */
const formatInputField = (component: any, panelKey: string): InputField => {
  return {
    key: `${panelKey ? panelKey + '.' : ''}${component.key}`,
    label: component.label || component.key,
    type: component.type,
    conditional: component.conditional,
    validate: component.validate,
    values: component.values || (component.data ? component.data.values : undefined),
    multiple: component.multiple
  };
};

/**
 * Extract all input fields from components
 */
const extractInputFields = (components: any[], panelKey: string, allInputFields: InputField[]): void => {
  components.forEach(component => {
    if (isInputField(component)) {
      allInputFields.push(formatInputField(component, panelKey));
    } else if (component.components) {
      // Recursively process nested components
      extractInputFields(component.components, panelKey, allInputFields);
    }
  });
};
