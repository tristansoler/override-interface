import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EsgOverrideComponent } from './esg-override.component';

describe('EsgOverrideComponent', () => {
  let component: EsgOverrideComponent;
  let fixture: ComponentFixture<EsgOverrideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsgOverrideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EsgOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
