import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ConstantData} from '../../shared/constant.data';
import {SearchUserModel} from '../../model/search-user.model';
import {ChatDataItemService} from '../../shared/chat-data-item.service';
import {ChatBoxModel} from '../../model/chat-box.model';

@Injectable({
  providedIn: 'root'
})
export class SideBarService {

  constructor(private httpClient: HttpClient,
              private chatDataItemService: ChatDataItemService) {
  }

  loadSearchUser(name: string): Promise<any> {
    let params = new HttpParams();
    params = params.append('name', name);
    return this.httpClient.get(ConstantData.API_SEARCH_USER_ENDPOINT, {params}).toPromise();
  }

  addOrRedirectChatBox(searchUserModel: SearchUserModel) {
    for (let i = 0; i < this.chatDataItemService.chatBoxModels.length; i++) {
      const curChatBoxModel = this.chatDataItemService.chatBoxModels[i];
      if (curChatBoxModel.chatBoxParam === searchUserModel.providerId) {
        this.chatDataItemService.changeActiveChatItemIndex(i);
        return;
      }
    }

    const chatBoxModel: ChatBoxModel = new ChatBoxModel();
    chatBoxModel.name = searchUserModel.name;
    chatBoxModel.photoUrl = searchUserModel.photoUrl;
    chatBoxModel.lastMessageContent = '...';
    chatBoxModel.lastMessageDate = null;
    chatBoxModel.chatBoxParam = searchUserModel.providerId;
    this.chatDataItemService.chatBoxModels.unshift(chatBoxModel);
    this.chatDataItemService.chatDataItemsNotify.next(null);
    this.chatDataItemService.changeActiveChatItemIndex(0);
  }
}
