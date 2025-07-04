/**
 * @class ProductSheet
 * @description '01_products'シートへのCRUD操作をカプセル化するクラス
 */
class ProductSheet {
    /**
     * @constructor
     */
    constructor() {
      try {
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        // '01_products'という名前のシートを取得
        this.sheet = this.spreadsheet.getSheetByName('01_products');
        if (!this.sheet) {
          throw new Error("シート '01_products' が見つかりません。");
        }
        // 1行目のヘッダーを取得
        const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
        // ヘッダーが空でないことを確認
        if (headers.filter(String).length === 0) {
          throw new Error("'01_products'シートのヘッダーが空です。");
        }
        this.headers = headers;
        // product_idの列インデックスをキャッシュ（0始まり）
        this.productIdColIndex = this.headers.indexOf('product_id');
        if (this.productIdColIndex === -1) {
          throw new Error("'product_id' 列が見つかりません。");
        }
      } catch (e) {
        Logger.log(`ProductSheet初期化エラー: ${e.message}`);
        throw e; // エラーを再スローして処理を中断
      }
    }
  
    /**
     * ヘッダーとデータ行をオブジェクトの配列に変換するプライベートメソッド
     * @private
     * @param {Array<Array<any>>} data - 2次元配列のデータ
     * @returns {Array<Object>} オブジェクトの配列
     */
    _mapToObjects(data) {
      return data.map(row => {
        const obj = {};
        this.headers.forEach((header, index) => {
          // 日付オブジェクトをISO文字列に変換してタイムゾーン問題を回避
          obj[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
        });
        return obj;
      });
    }
  
    /**
     * 【READ】全ての製品レコードを取得する
     * @returns {Array<Object>} 全ての製品レコードのオブジェクト配列
     */
    getAllProducts() {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) {
        return []; // データ行がない場合は空配列を返す
      }
      const data = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
      return this._mapToObjects(data);
    }
  
    /**
     * 【READ】指定されたproduct_idのレコードを取得する
     * @param {string} productId - 検索する製品ID
     * @returns {Object|null} 見つかった製品レコードのオブジェクト、またはnull
     */
    getProductById(productId) {
      const allProducts = this.getAllProducts();
      return allProducts.find(product => product.product_id === productId) || null;
    }
  
    /**
     * 【CREATE】新しい製品レコードを追加する
     * @param {Object} productObject - 追加する製品のオブジェクト。product_idは必須。
     * @returns {Object} 追加された製品レコードのオブジェクト
     */
    createProduct(productObject) {
      if (!productObject.product_id) {
        throw new Error("新しい製品には 'product_id' が必須です。");
      }
      if (this.getProductById(productObject.product_id)) {
        throw new Error(`製品ID '${productObject.product_id}' は既に存在します。`);
      }
  
      // 日付フィールドを自動設定
      const now = new Date().toISOString();
      productObject.created_at = now;
      productObject.updated_at = now;
  
      // ヘッダーの順序に従って配列を作成
      const newRow = this.headers.map(header => productObject[header] || '');
      this.sheet.appendRow(newRow);
      
      // 追加したデータを返す（確認のため）
      return productObject;
    }
  
    /**
     * 【UPDATE】指定されたproduct_idのレコードを更新する
     * @param {string} productId - 更新する製品ID
     * @param {Object} updateObject - 更新内容のオブジェクト。product_idの更新は不可。
     * @returns {Object|null} 更新された製品レコードのオブジェクト、またはnull
     */
    updateProduct(productId, updateObject) {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) return null;
      
      const productIds = this.sheet.getRange(2, this.productIdColIndex + 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = productIds.indexOf(productId);
  
      if (rowIndex === -1) {
        return null; // 対象が見つからない
      }
      
      // 行インデックスは2始まりなので+2する
      const targetRowIndex = rowIndex + 2; 
  
      // 各ヘッダーに対応する列を更新
      // updated_atも自動更新
      updateObject.updated_at = new Date().toISOString();
      
      this.headers.forEach((header, index) => {
        if (header in updateObject && header !== 'product_id') { // product_idは変更しない
          this.sheet.getRange(targetRowIndex, index + 1).setValue(updateObject[header]);
        }
      });
  
      // 更新後のデータを取得して返す
      const updatedRowValues = this.sheet.getRange(targetRowIndex, 1, 1, this.headers.length).getValues();
      return this._mapToObjects(updatedRowValues)[0];
    }
  
    /**
     * 【DELETE】指定されたproduct_idのレコードを削除する
     * @param {string} productId - 削除する製品ID
     * @returns {boolean} 削除が成功した場合はtrue
     */
    deleteProduct(productId) {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) return false;
  
      const productIds = this.sheet.getRange(2, this.productIdColIndex + 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = productIds.indexOf(productId);
  
      if (rowIndex === -1) {
        return false; // 対象が見つからない
      }
  
      // 行インデックスは2始まりなので+2する
      this.sheet.deleteRow(rowIndex + 2);
      return true;
    }
  }