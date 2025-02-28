document.addEventListener('DOMContentLoaded', function() {
  // Get references to all form sections
  const metricsSection = document.getElementById('metrics-section');
  const overrideValueSection = document.getElementById('override-value-section');
  const overrideTypeSection = document.getElementById('override-type-section');
  const overrideGroundsSection = document.getElementById('override-grounds-section');
  const extendOverrideSection = document.getElementById('extend-override-section');
  const submitSection = document.getElementById('submit-section');
  const resultsSection = document.getElementById('results-section');
  
  // Get references to input elements
  const companySelect = document.getElementById('company-select');
  const esgSelect = document.getElementById('esg-select');
  const overrideValueRadios = document.getElementsByName('override-value');
  const otherValueContainer = document.getElementById('other-value-container');
  const otherValueInput = document.getElementById('other-value');
  const strategyBtn = document.getElementById('btn-strategy');
  const metricBtn = document.getElementById('btn-metric');
  const groundRadios = document.getElementsByName('override-ground');
  const extendRadios = document.getElementsByName('extend-override');
  const companyListContainer = document.getElementById('company-list-container');
  const companyListTextarea = document.getElementById('company-list');
  const submitBtn = document.getElementById('btn-submit');
  const sqlQuery = document.getElementById('sql-query');
  const copyBtn = document.getElementById('btn-copy');
  const executeBtn = document.getElementById('btn-execute');
  
  // Form state
  let formData = {
    company: '',
    metric: '',
    overrideValue: '',
    customValue: '',
    overrideType: '',
    ground: '',
    extend: false,
    companies: []
  };
  
  // Step 1: Company Selection
  companySelect.addEventListener('change', function() {
    formData.company = this.value;
  });
  
  // Step 2: ESG Metric Selection
  esgSelect.addEventListener('change', function() {
    formData.metric = this.value;
  });
  
  // Step 3: Override Value Selection
  overrideValueRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      formData.overrideValue = this.value;
      
      if (this.value === 'OTHER') {
        otherValueContainer.style.display = 'block';
      } else {
        otherValueContainer.style.display = 'none';
        formData.customValue = '';
        otherValueInput.value = '';
      }
    });
  });
  
  // Handle custom value input
  otherValueInput.addEventListener('input', function() {
    formData.customValue = this.value;
  });
  
  // Step 4: Override Type Selection
  strategyBtn.addEventListener('click', function() {
    formData.overrideType = 'strategy';
    this.classList.add('active');
    metricBtn.classList.remove('active');
    
    // Show grounds section for strategy overrides
    overrideGroundsSection.style.display = 'block';
  });
  
  metricBtn.addEventListener('click', function() {
    formData.overrideType = 'metric';
    this.classList.add('active');
    strategyBtn.classList.remove('active');
    
    // Hide grounds section for metric overrides
    overrideGroundsSection.style.display = 'none';
  });
  
  // Step 5: Override Grounds (for Strategy only)
  groundRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      formData.ground = this.value;
    });
  });
  
  // Step 6: Extend Override
  extendRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      formData.extend = this.value === 'yes';
      
      if (this.value === 'yes') {
        companyListContainer.style.display = 'block';
      } else {
        companyListContainer.style.display = 'none';
        formData.companies = [];
        companyListTextarea.value = '';
      }
    });
  });
  
  companyListTextarea.addEventListener('input', function() {
    const companies = this.value.split('\n').filter(company => company.trim() !== '');
    formData.companies = companies;
  });
  
  // Submit and Generate SQL
  submitBtn.addEventListener('click', function() {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Generate unique override IDs
    const mainOverrideId = generateOverrideId();
    
    // Construct the base SQL query
    let sqlQueryText = generateSqlQuery(formData, mainOverrideId);
    
    // Display the SQL query
    sqlQuery.textContent = sqlQueryText;
    
    // Show the results section
    resultsSection.style.display = 'block';
    window.scrollTo({ top: resultsSection.offsetTop - 20, behavior: 'smooth' });
  });
  
  // Validate form before submission
  function validateForm() {
    if (!formData.company) {
      alert('Please select a company');
      companySelect.focus();
      return false;
    }
    
    if (!formData.metric) {
      alert('Please select an ESG metric/strategy');
      esgSelect.focus();
      return false;
    }
    
    if (!formData.overrideValue) {
      alert('Please select an override value');
      return false;
    }
    
    if (formData.overrideValue === 'OTHER' && !formData.customValue) {
      alert('Please specify a custom override value');
      otherValueInput.focus();
      return false;
    }
    
    if (!formData.overrideType) {
      alert('Please select whether this is a strategy or metric override');
      return false;
    }
    
    if (formData.overrideType === 'strategy' && !formData.ground) {
      alert('Please select the ground for the strategy override');
      return false;
    }
    
    if (formData.extend && formData.companies.length === 0) {
      alert('Please enter at least one company name or select "No" for extending the override');
      companyListTextarea.focus();
      return false;
    }
    
    return true;
  }
  
  // Copy Query button
  copyBtn.addEventListener('click', function() {
    const textToCopy = sqlQuery.textContent;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Error copying text: ', err);
      });
  });
  
  // Execute Query button
  executeBtn.addEventListener('click', function() {
    alert('Query execution would be implemented in the final version. This is just a mockup.');
  });
  
  // Helper function to generate a random override ID
  function generateOverrideId() {
    // Format example: OVR_20250228_12345
    const date = new Date();
    const dateStr = date.getFullYear() + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `OVR_${dateStr}_${randomNum}`;
  }
  
  // Helper function to generate SQL query
  function generateSqlQuery(data, mainOverrideId) {
    const currentDate = new Date().toISOString().split('T')[0];
    const nextCheckDate = new Date();
    nextCheckDate.setMonth(nextCheckDate.getMonth() + 3); // Check again in 3 months
    const nextCheckDateStr = nextCheckDate.toISOString().split('T')[0];
    
    const finalValue = data.overrideValue === 'OTHER' ? data.customValue : data.overrideValue;
    
    // Start building the SQL query
    let sql = `-- Main override for ${data.company}\n`;
    sql += `INSERT INTO esg_overrides (\n`;
    sql += `  ovr_id, last_check_date, next_check_date, issuer_name, ovr_target,\n`;
    sql += `  source_value, ovr_value, ovr_active, inherited_ovr, inherited_ovr_id,\n`;
    
    if (data.overrideType === 'strategy') {
      sql += `  og_${data.ground}, company_inheriting`;
    } else {
      sql += `  company_inheriting`;
    }
    
    sql += `\n) VALUES (\n`;
    sql += `  '${mainOverrideId}', '${currentDate}', '${nextCheckDateStr}', '${data.company}', '${data.metric}',\n`;
    sql += `  NULL, '${finalValue}', TRUE, FALSE, NULL,\n`;
    
    if (data.overrideType === 'strategy') {
      sql += `  TRUE, ${data.extend ? 'TRUE' : 'FALSE'}\n`;
    } else {
      sql += `  ${data.extend ? 'TRUE' : 'FALSE'}\n`;
    }
    
    sql += `);\n\n`;
    
    // Add additional overrides for subsidiary companies if needed
    if (data.extend && data.companies.length > 0) {
      sql += `-- Inherited overrides for subsidiaries\n`;
      
      data.companies.forEach(company => {
        const childOverrideId = generateOverrideId();
        
        sql += `INSERT INTO esg_overrides (\n`;
        sql += `  ovr_id, last_check_date, next_check_date, issuer_name, ovr_target,\n`;
        sql += `  source_value, ovr_value, ovr_active, inherited_ovr, inherited_ovr_id,\n`;
        
        if (data.overrideType === 'strategy') {
          sql += `  og_${data.ground}, company_inheriting`;
        } else {
          sql += `  company_inheriting`;
        }
        
        sql += `\n) VALUES (\n`;
        sql += `  '${childOverrideId}', '${currentDate}', '${nextCheckDateStr}', '${company}', '${data.metric}',\n`;
        sql += `  NULL, '${finalValue}', TRUE, TRUE, '${mainOverrideId}',\n`;
        
        if (data.overrideType === 'strategy') {
          sql += `  TRUE, FALSE\n`;
        } else {
          sql += `  FALSE\n`;
        }
        
        sql += `);\n`;
      });
    }
    
    return sql;
  }
});