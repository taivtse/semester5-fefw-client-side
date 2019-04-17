import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {MessageDataItem} from '../../model/message-data.item';
import {ChatBoxDataItem} from '../../model/chat-box-data.item';
import {SharedData} from '../../shared/shared.data';
import {ChatDataItemService} from '../../shared/chat-data-item.service';
import {ChatService} from '../../shared/chat.service';
import {SocketMessageModel} from '../../model/socket-message.model';
import {MessageType} from '../../model/message.type';
import {BeanUtil} from '../../shared/bean.util';
import {ChatBoxModel} from '../../model/chat-box.model';
import {MemberModel} from '../../model/member.model';
import {UserModel} from '../../model/user.model';

@Component({
  selector: 'app-main-box',
  templateUrl: './main-box.component.html',
  styleUrls: ['./main-box.component.css']
})
export class MainBoxComponent implements OnInit, OnDestroy {
  @ViewChild('chattingInput') private chattingInput: ElementRef<HTMLInputElement>;
  chatBoxParam: string;
  chatBoxDataItemMap = new Map<string, ChatBoxDataItem>();
  currentChatBoxDataItem: ChatBoxDataItem;

  constructor(private route: ActivatedRoute,
              private chatDataItemService: ChatDataItemService,
              private chatService: ChatService) {
  }

  ngOnInit() {
    this.chatService.connect(this, this.onMessageReceived);
    this.chatDataItemService.chatDataItemsNotify.subscribe(() => {
      this.chatDataItemService.chatBoxModels.forEach(chatBoxModel => {
        if (!this.chatBoxDataItemMap.has(chatBoxModel.chatBoxParam)) {
          const chatBoxDataItem = new ChatBoxDataItem();
          BeanUtil.copyProperties(chatBoxDataItem, chatBoxModel);
          this.chatBoxDataItemMap.set(chatBoxModel.chatBoxParam, chatBoxDataItem);
        }
      });

      if (this.chatDataItemService.isChatDataItemsLoaded) {
        // subscribe param once
        this.chatDataItemService.isChatDataItemsLoaded = false;

        this.route.paramMap.subscribe((params: ParamMap) => {
          // set current chat box data item
          this.chatBoxParam = params.get('chatBoxParam');
          this.currentChatBoxDataItem = this.chatBoxDataItemMap.get(this.chatBoxParam);

          // focus and set the current typing message
          this.chattingInput.nativeElement.focus();
          this.chattingInput.nativeElement.value = this.getCurrentTypingMessageInChatInput();
        });

        // set active for the chat item
        const activeChatItemIndex = this.getChatItemIndex();
        this.chatDataItemService.changeActiveChatItemIndex(activeChatItemIndex);
      }
    });
  }

  getChatItemIndex(): number {
    let index = -1;
    for (const key of Array.from(this.chatBoxDataItemMap.keys())) {
      index++;
      if (key === this.chatBoxParam) {
        return index;
      }
    }
    return -1;
  }

  onSendMessage(): void {
    if (this.chattingInput.nativeElement.value === '') {
      return;
    }

    // process if chat box not already exists
    const socketMessageModel = new SocketMessageModel();
    const activeChatBoxModel = this.chatDataItemService.getActiveChatBoxModel();
    debugger
    if (this.currentChatBoxDataItem.id == null) {
      this.chatService.createNewChatBox()
        .then((chatBoxModel: ChatBoxModel) => {
          // create new chat box
          activeChatBoxModel.id = chatBoxModel.id;
          this.currentChatBoxDataItem.id = chatBoxModel.id;
          console.log('tao chat box xong');
        }).then(() => {
        // create my new member
        const myMemberModel = new MemberModel();
        myMemberModel.chatBox = activeChatBoxModel;
        myMemberModel.user = SharedData.loggedInUser;

        this.chatService.createNewMember(myMemberModel)
          .then((memberModel: MemberModel) => {
            this.currentChatBoxDataItem.memberId = memberModel.id;

            console.log('tao member cua minh xong');
          }).then(() => {
          // create partner member in chat box
          const partnerMemberModel = new MemberModel();
          partnerMemberModel.chatBox = activeChatBoxModel;
          const partnerUser = new UserModel();
          partnerUser.id = activeChatBoxModel.partnerUserId;
          partnerMemberModel.user = partnerUser;

          this.chatService.createNewMember(partnerMemberModel)
            .then((memberModel: MemberModel) => {
              console.log('tao member cua partner xong');
              socketMessageModel.receivedMemberId = memberModel.id;
              this.doSendMessage(socketMessageModel);
            });
        });
      });
    } else {
      this.doSendMessage(socketMessageModel);
    }
  }

  doSendMessage(socketMessageModel: SocketMessageModel) {
    socketMessageModel.content = this.chattingInput.nativeElement.value.trim();
    socketMessageModel.date = new Date();
    socketMessageModel.type = MessageType.TEXT;
    socketMessageModel.sentMemberId = this.currentChatBoxDataItem.memberId;
    socketMessageModel.sentUserProviderId = SharedData.loggedInUser.providerId;
    socketMessageModel.receivedUserProviderId = this.chatBoxParam;

    this.chatService.sendMessage(socketMessageModel)
      .then(() => {
        const messageDataItem = new MessageDataItem();
        BeanUtil.copyProperties(messageDataItem, socketMessageModel);
        messageDataItem.tooltipPlacement = 'left';
        messageDataItem.photoUrl = SharedData.loggedInUser.photoUrl;
        messageDataItem.cssClass = 'sent';
        this.chatBoxDataItemMap.get(this.chatBoxParam).messageDataItems.push(messageDataItem);
        this.progressAfterSendMessage(messageDataItem);
      }).catch(err => console.log(err));
  }

  onMessageReceived(_this, body: string): void {
    const socketMessageModel: SocketMessageModel = JSON.parse(body);
    const messageDataItem = new MessageDataItem();
    BeanUtil.copyProperties(messageDataItem, socketMessageModel);
    messageDataItem.tooltipPlacement = 'right';
    messageDataItem.photoUrl = SharedData.loggedInUser.photoUrl;
    messageDataItem.cssClass = 'replies';

    const sentUserProviderId = socketMessageModel.sentUserProviderId;

    if (_this.chatBoxDataItemMap.has(sentUserProviderId)) {
      for (let i = 0; i < _this.chatDataItemService.chatBoxModels.length; i++) {
        const curChatBoxModel = _this.chatDataItemService.chatBoxModels[i];

        if (curChatBoxModel.chatBoxParam === sentUserProviderId) {
          _this.chatDataItemService.moveChatItemToTop(i);

          //  set last message content and last message date in chat item
          _this.chatDataItemService.chatBoxModels[0].lastMessageContent = messageDataItem.content;
          _this.chatDataItemService.chatBoxModels[0].lastMessageDate = messageDataItem.date;

          // set read status if user in another chat box
          if (_this.chatBoxParam !== sentUserProviderId) {
            _this.chatDataItemService.chatBoxModels[0].readStatus = false;
          }

          _this.chatBoxDataItemMap.get(sentUserProviderId).messageDataItems.push(messageDataItem);
          break;
        }
      }
    } else {
      _this.chatService.getChatBoxDataItemByMemberId(socketMessageModel.receivedMemberId)
        .then((chatBoxModel: ChatBoxModel) => {
          _this.chatDataItemService.chatBoxModels.unshift(chatBoxModel);
          _this.chatDataItemService.chatDataItemsNotify.next(null);
          _this.chatBoxDataItemMap.get(sentUserProviderId).messageDataItems.push(messageDataItem);
        });
    }
  }

  progressAfterSendMessage(messageDataItem: MessageDataItem) {
    this.chattingInput.nativeElement.focus();
    this.chattingInput.nativeElement.value = '';
    this.currentChatBoxDataItem.currentTypingMessage = '';

    //  set current chat item to top
    this.chatDataItemService.moveActiveChatItemToTop();

    //  set last message content and last message date in chat item
    this.chatDataItemService.chatBoxModels[0].lastMessageContent = 'You: ' + messageDataItem.content;
    this.chatDataItemService.chatBoxModels[0].lastMessageDate = messageDataItem.date;
  }

  setCurrentTypingMessageInChatInput() {
    if (this.currentChatBoxDataItem) {
      this.currentChatBoxDataItem.currentTypingMessage = this.chattingInput.nativeElement.value;
    }
  }

  getCurrentTypingMessageInChatInput(): string {
    if (this.currentChatBoxDataItem) {
      return this.currentChatBoxDataItem.currentTypingMessage;
    }
    return '';
  }

  onKeyEventHandler(event) {
    this.setCurrentTypingMessageInChatInput();

    if (event.code === 'Enter') {
      this.onSendMessage();
    }
  }

  ngOnDestroy(): void {
    this.chatService.chanelSubscription.unsubscribe({});
  }
}
