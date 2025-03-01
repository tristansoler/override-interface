import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-esg-override',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './esg-override.component.html',
  styleUrls: ['./esg-override.component.css']
})
export class EsgOverrideComponent implements OnInit {
  overrideForm: FormGroup;
  sqlQuery: string = '';
  showResults: boolean = false;

  // Mock data - in a real app, these would come from a service
  companies = [
    { id: 'company1', name: 'Acme Corporation' },
    { id: 'company2', name: 'Globex Industries' },
    { id: 'company3', name: 'Wayne Enterprises' },
    { id: 'company4', name: 'Stark Industries' },
    { id: 'company5', name: 'Umbrella Corporation' }
  ];

  esgMetrics = [
    { id: 'carbon_emissions', name: 'Carbon Emissions' },
    { id: 'water_usage', name: 'Water Usage' },
    { id: 'board_diversity', name: 'Board Diversity' },
    { id: 'labor_practices', name: 'Labor Practices' },
    { id: 'data_privacy', name: 'Data Privacy' },
    { id: 'climate_risk', name: 'Climate Risk Strategy' },
    { id: 'human_rights', name: 'Human Rights Policy' },
    { id: 'supply_chain', name: 'Supply Chain Management' }
  ];

  constructor(private fb: FormBuilder) { 
    this.overrideForm = this.fb.group({
      company: ['', Validators.required],
      metric: ['', Validators.required],
      overrideValue: ['', Validators.required],
      customValue: [''],
      overrideType: ['', Validators.required],
      ground: [''],
      extend: [false],
      companies: ['']
    });
  }

  ngOnInit(): void {
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    // Add conditional validation
    this.overrideForm.get('overrideValue')?.valueChanges.subscribe(value => {
      const customValueControl = this.overrideForm.get('customValue');
      if (value === 'OTHER') {
        customValueControl?.setValidators(Validators.required);
      } else {
        customValueControl?.clearValidators();
        customValueControl?.setValue('');
      }
      customValueControl?.updateValueAndValidity();
    });

    this.overrideForm.get('overrideType')?.valueChanges.subscribe(value => {
      const groundControl = this.overrideForm.get('ground');
      if (value === 'strategy') {
        groundControl?.setValidators(Validators.required);
      } else {
        groundControl?.clearValidators();
        groundControl?.setValue('');
      }
      groundControl?.updateValueAndValidity();
    });

    this.overrideForm.get('extend')?.valueChanges.subscribe(value => {
      const companiesControl = this.overrideForm.get('companies');
      if (value) {
        companiesControl?.setValidators(Validators.required);
      } else {
        companiesControl?.clearValidators();
        companiesControl?.setValue('');
      }
      companiesControl?.updateValueAndValidity();
    });
  }

  get showCustomValue(): boolean {
    return this.overrideForm.get('overrideValue')?.value === 'OTHER';
  }

  get showGroundSelection(): boolean {
    return this.overrideForm.get('overrideType')?.value === 'strategy';
  }

  get showCompanyList(): boolean {
    return this.overrideForm.get('extend')?.value;
  }

  onSubmit(): void {
    if (this.overrideForm.invalid) {
      this.markFormGroupTouched(this.overrideForm);
      return;
    }

    const formData = this.overrideForm.value;
    
    // Generate unique override IDs
    const mainOverrideId = this.generateOverrideId();
    
    // Generate SQL query
    this.sqlQuery = this.generateSqlQuery(formData, mainOverrideId);
    this.showResults = true;

    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Helper to mark all form controls as touched to trigger validation
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Generate a random override ID
  generateOverrideId(): string {
    const date = new Date();
    const dateStr = date.getFullYear() + 
                    String(date.getMonth() + 1).padStart(2, '0') + 
                    String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `OVR_${dateStr}_${randomNum}`;
  }

  // Generate SQL Query
  generateSqlQuery(data: any, mainOverrideId: string): string {
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
    if (data.extend && data.companies) {
      const companyList = data.companies.split('\n').filter((company: string) => company.trim() !== '');
      
      if (companyList.length > 0) {
        sql += `-- Inherited overrides for subsidiaries\n`;
        
        companyList.forEach((company: string) => {
          const childOverrideId = this.generateOverrideId();
          
          sql += `INSERT INTO esg_overrides (\n`;
          sql += `  ovr_id, last_check_date, next_check_date, issuer_name, ovr_target,\n`;
          sql += `  source_value, ovr_value, ovr_active, inherited_ovr, inherited_ovr_id,\n`;
          
          if (data.overrideType === 'strategy') {
            sql += `  og_${data.ground}, company_inheriting`;
          } else {
            sql += `  company_inheriting`;
          }
          
          sql += `\n) VALUES (\n`;
          sql += `  '${childOverrideId}', '${currentDate}', '${nextCheckDateStr}', '${company.trim()}', '${data.metric}',\n`;
          sql += `  NULL, '${finalValue}', TRUE, TRUE, '${mainOverrideId}',\n`;
          
          if (data.overrideType === 'strategy') {
            sql += `  TRUE, FALSE\n`;
          } else {
            sql += `  FALSE\n`;
          }
          
          sql += `);\n`;
        });
      }
    }
    
    return sql;
  }

  copyQuery(): void {
    navigator.clipboard.writeText(this.sqlQuery)
      .then(() => {
        alert('Query copied to clipboard!');
      })
      .catch(err => {
        console.error('Error copying text: ', err);
      });
  }

  executeQuery(): void {
    alert('Query execution would be implemented in the final version.');
  }
}