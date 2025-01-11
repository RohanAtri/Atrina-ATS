import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulkUploadComponent } from './components/bulk-upload/bulk-upload.component';
import { AttachmentComponent } from './components/attachment/attachment.component';

const routes: Routes = [
  {path:'',redirectTo:'bulk-upload',pathMatch:'full'},
  {path:'bulk-upload', component:BulkUploadComponent},
  {path:'attachment',component:AttachmentComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
