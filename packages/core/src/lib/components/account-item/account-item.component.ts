import { Component, Input } from '@angular/core'
import { AirGapWallet } from '@zarclays/zgap-coinlib-core'

@Component({
  selector: 'airgap-account-item',
  templateUrl: './account-item.component.html',
  styleUrls: ['./account-item.component.scss']
})
export class AccountItemComponent {
  @Input()
  public wallet: AirGapWallet | undefined
}
