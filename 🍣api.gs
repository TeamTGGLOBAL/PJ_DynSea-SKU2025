/**
 * WebアプリケーションとしてGETリクエストを処理するメイン関数
 * @param {Object} e - Googleから渡されるイベントオブジェクト
 * @returns {ContentService.TextOutput} JSON形式のレスポンス
 * 
 * 使い方（デプロイ後のURL）：
 * /exec?action=getProduct&id=prod_test_hirame
 * /exec?action=getAllProducts
 */
function doGet(e) {
    // CORSを許可するためのヘッダー（外部のWebページから呼び出す場合に必要）
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  
    try {
      // URLパラメータから実行したいアクションとIDを取得
      const action = e.parameter.action;
      const id = e.parameter.id;
  
      const service = new ProductService();
      let data;
  
      // actionパラメータに応じて処理を振り分ける
      switch (action) {
        case 'getProduct':
          if (!id) {
            throw new Error("パラメータ 'id' が必要です。");
          }
          data = service.getProductWithDetails(id); // JSON文字列ではなくオブジェクトを取得
          if (!data) {
            throw new Error(`製品ID '${id}' が見つかりません。`);
          }
          break;
  
        case 'getAllProducts':
          data = service.productSheet.getAllProducts(); // Productのリストを取得
          break;
        
        // 今後、他の'GET'アクションを追加可能
        // case 'getVariant':
        //   data = service.variantsSheet.getVariantById(id);
        //   break;
  
        default:
          throw new Error("無効なアクションです。'action'パラメータを確認してください。");
      }
  
      // 成功レスポンスを返す
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: data }, null, 2))
        .setMimeType(ContentService.MimeType.JSON)
        .withHeaders(headers);
  
    } catch (error) {
      // エラーレスポンスを返す
      Logger.log(error); // ログにエラーを記録
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
        .setMimeType(ContentService.MimeType.JSON)
        .withHeaders(headers);
    }
  }