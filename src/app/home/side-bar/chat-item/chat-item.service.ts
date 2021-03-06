import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ConstantData} from '../../../shared/constant.data';
import {SharedData} from '../../../shared/shared.data';

@Injectable({
  providedIn: 'root'
})
export class ChatItemService {

  constructor(private httpClient: HttpClient) {
  }

  updateReadStatusByMemberId(memberId: number, readStatus: boolean): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const data = {memberId, readStatus};
    return this.httpClient.put(ConstantData.API_MEMBER_ENDPOINT, data).toPromise();
  }

}
