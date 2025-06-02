// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher

const tencentcloud = require("tencentcloud-sdk-nodejs-sms");
const SmsClient = tencentcloud.sms.v20210111.Client;
const config = require('../config').tencentSms;
const logger = require('./logger');

class SmsService {
  constructor() {
    this.client = new SmsClient(config);
  }

  /**
   * 发送验证码短信
   * @param {string} phoneNumber - 手机号码
   * @param {string} code - 验证码
   * @returns {Promise<Object>} 发送结果，包含发送状态、计费条数等信息
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      // api doc： https://cloud.tencent.com/document/api/382/55981#1.-.E6.8E.A5.E5.8F.A3.E6.8F.8F.E8.BF.B0
      const params = {
        PhoneNumberSet: [phoneNumber],
        SmsSdkAppId: config.SmsSdkAppId,
        SignName: config.SignName,
        TemplateId: config.TemplateId,
        TemplateParamSet: [code]
      };

      const result = await this.client.SendSms(params);
      
      // 检查API返回结果
      const { SendStatusSet, RequestId } = result.Response;
      
      // 检查所有号码的发送状态
      const failedMessages = SendStatusSet.filter(status => status.Code !== "Ok");
      
      if (failedMessages.length > 0) {
        const errors = failedMessages.map(status => ({
          phone: status.PhoneNumber,
          message: status.Message,
          code: status.Code
        }));
        throw new Error(JSON.stringify(errors));
      }

      // 记录成功发送的日志
      logger.info('SMS sent successfully', {
        requestId: RequestId,
        phoneNumber,
        status: SendStatusSet[0].Message,
        serialNo: SendStatusSet[0].SerialNo,
        fee: SendStatusSet[0].Fee
      });

      return {
        success: true,
        requestId: RequestId,
        details: SendStatusSet.map(status => ({
          phoneNumber: status.PhoneNumber,
          serialNo: status.SerialNo,
          fee: status.Fee,
          message: status.Message
        }))
      };
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      throw error;
    }
  }
}

module.exports = new SmsService();
