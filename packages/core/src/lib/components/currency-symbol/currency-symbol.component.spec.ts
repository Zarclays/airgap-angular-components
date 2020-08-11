import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { CurrencySymbolComponent } from './currency-symbol.component'

describe('CurrencySymbolComponent', () => {
  let component: CurrencySymbolComponent
  let fixture: ComponentFixture<CurrencySymbolComponent>

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [CurrencySymbolComponent]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
