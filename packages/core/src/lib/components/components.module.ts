import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../pipes/pipes.module'
import { CurrencySymbolComponent } from './currency-symbol/currency-symbol.component'
import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'
import { LabeledAddressComponent } from './labeled-address/labeled-address.component'
import { LabeledDetailsComponent } from './labeled-details/labeled-details.component';
import { NetworkBadgeComponent } from './network-badge/network-badge.component'

@NgModule({
  declarations: [FromToComponent, IdenticonComponent, LabeledDetailsComponent, LabeledAddressComponent, CurrencySymbolComponent, NetworkBadgeComponent],
  imports: [CommonModule, IonicModule, PipesModule],
  exports: [FromToComponent, IdenticonComponent, LabeledDetailsComponent, LabeledAddressComponent, CurrencySymbolComponent, NetworkBadgeComponent]
})
export class ComponentsModule {}
