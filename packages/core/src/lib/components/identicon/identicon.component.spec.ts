import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { IdenticonComponent } from './identicon.component'

describe('IdenticonComponent', () => {
  let component: IdenticonComponent
  let fixture: ComponentFixture<IdenticonComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        declarations: []
      })
    ).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(IdenticonComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
