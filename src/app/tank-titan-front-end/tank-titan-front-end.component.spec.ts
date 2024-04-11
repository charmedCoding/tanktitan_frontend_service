import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TankTitanFrontEndComponent } from './tank-titan-front-end.component';

describe('TankTitanFrontEndComponent', () => {
  let component: TankTitanFrontEndComponent;
  let fixture: ComponentFixture<TankTitanFrontEndComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TankTitanFrontEndComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TankTitanFrontEndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
