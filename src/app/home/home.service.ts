import {Injectable} from '@angular/core';
import {SharedData} from '../shared/shared.data';
import {UserAuthApiService} from '../shared/user-auth-api.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ChatDataItemService} from '../shared/chat-data-item.service';
import {ConstantData} from '../shared/constant.data';
import {ChatBoxModel} from '../model/chat-box.model';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(private userAuthApiService: UserAuthApiService,
              private httpClient: HttpClient,
              private chatDataItemService: ChatDataItemService) {
  }

  checkSessionIn(): Promise<any> {
    return this.userAuthApiService.authenticateUser(SharedData.loggedInUser);
  }

  loadChatBoxDataItems(): Promise<any> {
    let params = new HttpParams();
    params = params.append('userId', String(SharedData.loggedInUser.id));
    return this.httpClient.get(ConstantData.API_CHATBOX_ENDPOINT, {params}).toPromise()
      .then(chatBoxModels => {
        if ((chatBoxModels as Array<ChatBoxModel>).length > 0) {
          this.chatDataItemService.chatBoxModels = (chatBoxModels as Array<ChatBoxModel>);
          this.chatDataItemService.isChatDataItemsLoaded = true;
          this.chatDataItemService.chatDataItemsNotify.next(null);
        }
      });
  }
}
