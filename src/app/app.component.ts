import {Component} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {StorageUtil} from './shared/storage.util';
import {ConstantData} from './shared/constant.data';
import {UserModel} from './model/user.model';
import {SharedData} from './shared/shared.data';
import {UserAuthApiService} from './shared/user-auth-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private titleService: Title,
              private userAuthApiService: UserAuthApiService) {
    this.titleService.setTitle('Connect Now');

    SharedData.loggedInUser = StorageUtil.getLocalStorage(ConstantData.LOGGED_IN_USER_KEY) as UserModel;
    if (SharedData.loggedInUser) {
      this.userAuthApiService.authenticateUser(SharedData.loggedInUser)
        .then(isSuccess => SharedData.isLoggedIn = isSuccess);
    } else {
      SharedData.loggedInUser = new UserModel();
    }
  }
}
