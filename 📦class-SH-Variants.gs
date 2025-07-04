/**
 * @class VariantsSheet
 * @description '02_variants'シートへのCRUD操作と関連検索をカプセル化するクラス
 */
class VariantsSheet {
    /**
     * @constructor
     */
    constructor() {
      try {
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        this.sheet = this.spreadsheet.getSheetByName('02_variants');
        if (!this.sheet) {
          throw new Error("シート '02_variants' が見つかりません。");
        }
        const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
        if (headers.filter(String).length === 0) {
          throw new Error("'02_variants'シートのヘッダーが空です。");
        }
        this.headers = headers;
        // 主要な列のインデックスをキャッシュ（0始まり）
        this.variantIdColIndex = this.headers.indexOf('variant_id');
        this.productIdColIndex = this.headers.indexOf('product_id');
  
        if (this.variantIdColIndex === -1) {
          throw new Error("'variant_id' 列が見つかりません。");
        }
        if (this.productIdColIndex === -1) {
          throw new Error("'product_id' 列が見つかりません。");
        }
      } catch (e) {
        Logger.log(`VariantsSheet初期化エラー: ${e.message}`);
        throw e;
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
          obj[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
        });
        return obj;
      });
    }
  
    /**
     * 【READ】全てのバリアントレコードを取得する
     * @returns {Array<Object>} 全てのバリアントレコードのオブジェクト配列
     */
    getAllVariants() {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) {
        return [];
      }
      const data = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
      return this._mapToObjects(data);
    }
  
    /**
     * 【READ】指定されたvariant_idのレコードを取得する
     * @param {string} variantId - 検索するバリアントID
     * @returns {Object|null} 見つかったバリアントレコードのオブジェクト、またはnull
     */
    getVariantById(variantId) {
      // パフォーマンス向上のため、全件取得ではなくIDで直接検索するアプローチも可能
      // ここではシンプルに全件走査で実装
      const allVariants = this.getAllVariants();
      return allVariants.find(variant => variant.variant_id === variantId) || null;
    }
    
    /**
     * 【READ】指定されたproduct_idに紐づく全てのバリアントレコードを取得する
     * @param {string} productId - 検索する製品ID
     * @returns {Array<Object>} 見つかったバリアントレコードのオブジェクト配列
     */
    getVariantsByProductId(productId) {
      const allVariants = this.getAllVariants();
      return allVariants.filter(variant => variant.product_id === productId);
    }
  
    /**
     * 【CREATE】新しいバリアントレコードを追加する
     * @param {Object} variantObject - 追加するバリアントのオブジェクト。variant_idとproduct_idは必須。
     * @returns {Object} 追加されたバリアントレコードのオブジェクト
     */
    createVariant(variantObject) {
      if (!variantObject.variant_id || !variantObject.product_id) {
        throw new Error("新しいバリアントには 'variant_id' と 'product_id' が必須です。");
      }
      if (this.getVariantById(variantObject.variant_id)) {
        throw new Error(`バリアントID '${variantObject.variant_id}' は既に存在します。`);
      }
  
      const now = new Date().toISOString();
      variantObject.created_at = now;
      variantObject.updated_at = now;
      // statusが未指定なら 'dynamic' をデフォルトにする
      variantObject.variant_status = variantObject.variant_status || 'dynamic'; 
  
      const newRow = this.headers.map(header => variantObject[header] || '');
      this.sheet.appendRow(newRow);
      
      return variantObject;
    }
  
    /**
     * 【UPDATE】指定されたvariant_idのレコードを更新する
     * @param {string} variantId - 更新するバリアントID
     * @param {Object} updateObject - 更新内容のオブジェクト。variant_idの更新は不可。
     * @returns {Object|null} 更新されたバリアントレコードのオブジェクト、またはnull
     */
    updateVariant(variantId, updateObject) {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) return null;
      
      const variantIds = this.sheet.getRange(2, this.variantIdColIndex + 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = variantIds.indexOf(variantId);
  
      if (rowIndex === -1) {
        return null;
      }
      
      const targetRowIndex = rowIndex + 2;
      updateObject.updated_at = new Date().toISOString();
      
      this.headers.forEach((header, index) => {
        if (header in updateObject && header !== 'variant_id') {
          this.sheet.getRange(targetRowIndex, index + 1).setValue(updateObject[header]);
        }
      });
  
      const updatedRowValues = this.sheet.getRange(targetRowIndex, 1, 1, this.headers.length).getValues();
      return this._mapToObjects(updatedRowValues)[0];
    }
  
    /**
     * 【DELETE】指定されたvariant_idのレコードを削除する
     * @param {string} variantId - 削除するバリアントID
     * @returns {boolean} 削除が成功した場合はtrue
     */
    deleteVariant(variantId) {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) return false;
  
      const variantIds = this.sheet.getRange(2, this.variantIdColIndex + 1, lastRow - 1, 1).getValues().flat();
      const rowIndex = variantIds.indexOf(variantId);
  
      if (rowIndex === -1) {
        return false;
      }
  
      this.sheet.deleteRow(rowIndex + 2);
      return true;
    }
  }
  
  /**
   * VariantsSheetクラスの動作をテストするための関数
   * 実行前に、01_productsシートに `prod_test_hirame` というIDのレコードが存在することを確認してください。
   */
  function main_testVariantsSheet() {
    Logger.log("--- VariantsSheetのテストを開始します ---");
  
    const variantsSheet = new VariantsSheet();
    const testProductId = 'prod_test_hirame'; // テスト用の親製品ID
    const testVariantId = 'var_test_hirame_L';
  
    // 事前準備：もしテストデータがあれば削除
    variantsSheet.deleteVariant(testVariantId);
  
    // 1. CREATE
    const newVariantData = {
      variant_id: testVariantId,
      product_id: testProductId,
      variant_name: 'テスト用ヒラメ大',
      size_id: 'size_L',
      quality_id: 'quality_a',
      base_price: 2000,
      price_unit_id: 'unit_kg'
    };
    try {
      const created = variantsSheet.createVariant(newVariantData);
      Logger.log(`✅ 1.【CREATE】バリアントを作成しました: ${created.variant_name}`);
    } catch(e) {
      Logger.log(`❌ 1.【CREATE】失敗: ${e.message}`);
    }
  
    // 2. READ by ID
    try {
      const found = variantsSheet.getVariantById(testVariantId);
      if (found) {
        Logger.log(`✅ 2.【READ by ID】バリアントを取得しました: ${found.variant_name}`);
      } else {
        Logger.log(`❌ 2.【READ by ID】見つかりません。`);
      }
    } catch(e) {
      Logger.log(`❌ 2.【READ by ID】失敗: ${e.message}`);
    }
  
    // 3. READ by Product ID
    try {
      const foundByProduct = variantsSheet.getVariantsByProductId(testProductId);
      Logger.log(`✅ 3.【READ by Product ID】'${testProductId}'に紐づくバリアントを ${foundByProduct.length}件 取得しました。`);
    } catch(e) {
      Logger.log(`❌ 3.【READ by Product ID】失敗: ${e.message}`);
    }
    
    // 4. UPDATE
    const updateData = {
      base_price: 2200,
      notes: '価格改定テスト'
    };
    try {
      const updated = variantsSheet.updateVariant(testVariantId, updateData);
      if (updated) {
        Logger.log(`✅ 4.【UPDATE】バリアントを更新しました。新しい価格: ${updated.base_price}`);
      } else {
        Logger.log(`❌ 4.【UPDATE】見つかりません。`);
      }
    } catch(e) {
      Logger.log(`❌ 4.【UPDATE】失敗: ${e.message}`);
    }
  
    // 5. DELETE
    try {
      const isDeleted = variantsSheet.deleteVariant(testVariantId);
      if (isDeleted) {
        Logger.log(`✅ 5.【DELETE】バリアントを削除しました。`);
      } else {
        Logger.log(`❌ 5.【DELETE】見つかりません。`);
      }
    } catch(e) {
      Logger.log(`❌ 5.【DELETE】失敗: ${e.message}`);
    }
  
    Logger.log("--- VariantsSheetのテストを終了します ---");
  }