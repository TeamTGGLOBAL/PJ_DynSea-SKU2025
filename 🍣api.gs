/**
 * 修正版：より堅牢な書き方
 * withHeadersが使えない問題を回避し、try-catchの範囲を明確にする
 */
function doGet(e) {
    let response;
    
    try {
      const action = e.parameter.action;
      const id = e.parameter.id;
  
      const service = new ProductService();
      let data;
  
      switch (action) {
        case 'getProduct':
          if (!id) {
            throw new Error("パラメータ 'id' が必要です。");
          }
          data = service.getProductWithDetails(id);
          if (!data) {
            // 404 Not Foundを返すのがよりRESTful
            response = { status: 'error', message: `製品ID '${id}' が見つかりません。` };
            // 本来はHTTPステータスコードも設定したいが、GASのContentServiceでは直接設定できない
          } else {
            response = { status: 'success', data: data };
          }
          break;
  
        case 'getAllProducts':
          data = service.productSheet.getAllProducts();
          response = { status: 'success', data: data };
          break;
        
        default:
          throw new Error("無効なアクションです。'action'パラメータを確認してください。");
      }
  
    } catch (error) {
      Logger.log(error);
      response = { status: 'error', message: error.message };
    }
  
    // 最後に一度だけContentServiceを呼び出す
    return ContentService
      .createTextOutput(JSON.stringify(response, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }