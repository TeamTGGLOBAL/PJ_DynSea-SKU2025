/**
 * @class LotsSheet
 * @description '03_lots'シートへのCRUD操作と関連検索をカプセル化するクラス
 */
class LotsSheet {
    /**
     * @constructor
     */
    constructor() {
      try {
        this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        this.sheet = this.spreadsheet.getSheetByName('03_lots');
        if (!this.sheet) {
          throw new Error("シート '03_lots' が見つかりません。");
        }
        const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
        if (headers.filter(String).length === 0) {
          throw new Error("'03_lots'シートのヘッダーが空です。");
        }
        this.headers = headers;
        // 主要な列のインデックスをキャッシュ
        this.lotIdColIndex = this.headers.indexOf('lot_id');
        this.variantIdColIndex = this.headers.indexOf('variant_id');
  
        if (this.lotIdColIndex === -1) {
          throw new Error("'lot_id' 列が見つかりません。");
        }
        if (this.variantIdColIndex === -1) {
          throw new Error("'variant_id' 列が見つかりません。");
        }
      } catch (e) {
        Logger.log(`LotsSheet初期化エラー: ${e.message}`);
        throw e;
      }
    }
  
    /**
     * ヘッダーとデータ行をオブジェクトの配列に変換するプライベートメソッド
     * @private
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
     * 【READ】全てのロットレコードを取得する
     * @returns {Array<Object>} 全てのロットレコードのオブジェクト配列
     */
    getAllLots() {
      const lastRow = this.sheet.getLastRow();
      if (lastRow < 2) {
        return [];
      }
      const data = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
      return this._mapToObjects(data);
    }
  
    /**
     * 【READ】指定されたlot_idのレコードを取得する
     * @param {string} lotId - 検索するロットID
     * @returns {Object|null} 見つかったロットレコードのオブジェクト、またはnull
     */
    getLotById(lotId) {
      const allLots = this.getAllLots();
      return allLots.find(lot => lot.lot_id === lotId) || null;
    }
    
    /**
     * 【READ】指定されたvariant_idに紐づく全てのロットレコードを取得する
     * @param {string} variantId - 検索するバリアントID
     * @returns {Array<Object>} 見つかったロットレコードのオブジェクト配列
     */
    getLotsByVariantId(variantId) {
      const allLots = this.getAllLots();
      return allLots.filter(lot => lot.variant_id === variantId);
    }
  
    /**
     * 【CREATE】新しいロットレコードを追加する
     * @param {Object} lotObject - 追加するロットのオブジェクト。variant_idは必須。lot_idは自動生成も可。
     * @returns {Object} 追加されたロットレコードのオブジェクト
     */
    createLot(lotObject) {
      if (!lotObject.variant_id) {
        throw new Error("新しいロットには 'variant_id' が必須です。");
      }
  
      // lot_idが提供されていない場合は自動生成する
      if (!lotObject.lot_id) {
        const now = new Date();
        const dateStr = Utilities.formatDate(now, 'JST', 'yyMMdd');
        const timeStr = Utilities.formatDate(now, 'JST', 'HHmmss');
        // より一意性を高めるためにランダムな文字列を追加
        const randomStr = Math.random().toString(36).substring(2, 6); 
        lotObject.lot_id = `lot_${dateStr}_${timeStr}_${randomStr}`;
      }
  
      if (this.getLotById(lotObject.lot_id)) {
        throw new Error(`ロットID '${lotObject.lot_id}' は既に存在します。`);
      }
  
      const nowISO = new Date().toISOString();
      lotObject.created_at = nowISO;
      lotObject.updated_at = nowISO;
      // statusが未指定なら '在庫' をデフォルトにする
      lotObject.status = lotObject.status || '在庫'; 
  
      const newRow = this.headers.map(header => lotObject[header] || '');
      this.sheet.appendRow(newRow);
      
      return lotObject;
    }
  
    /**
     * 【UPDATE】指定されたlot_idのレコードを更新する
     * @param {string} lotId - 更新するロットID
     * @param {Object} updateObject - 更新内容のオブジェクト。lot_idの更新は不可。
     * @returns {Object|null} 更新されたロットレコードのオブジェクト、またはnull
     */
    updateLot(lotId, updateObject) {
      // パフォーマンスのため、TextFinderを使うアプローチ
      const textFinder = this.sheet.createTextFinder(lotId).matchEntireCell(true);
      const foundCell = textFinder.findNext();
      
      if (!foundCell) return null;
  
      const targetRowIndex = foundCell.getRow();
      updateObject.updated_at = new Date().toISOString();
  
      this.headers.forEach((header, index) => {
        if (header in updateObject && header !== 'lot_id') {
          this.sheet.getRange(targetRowIndex, index + 1).setValue(updateObject[header]);
        }
      });
  
      const updatedRowValues = this.sheet.getRange(targetRowIndex, 1, 1, this.headers.length).getValues();
      return this._mapToObjects(updatedRowValues)[0];
    }
  
    /**
     * 【DELETE】指定されたlot_idのレコードを削除する
     * @param {string} lotId - 削除するロットID
     * @returns {boolean} 削除が成功した場合はtrue
     */
    deleteLot(lotId) {
      // パフォーマンスのため、TextFinderを使うアプローチ
      const textFinder = this.sheet.createTextFinder(lotId).matchEntireCell(true);
      const foundCell = textFinder.findNext();
  
      if (!foundCell) return false;
      
      this.sheet.deleteRow(foundCell.getRow());
      return true;
    }
  }
  
  /**
   * LotsSheetクラスの動作をテストするための関数
   * 実行前に、02_variantsシートに `var_test_saba_M` というIDのレコードが存在することを確認してください。
   */
  function main_testLotsSheet() {
    Logger.log("--- LotsSheetのテストを開始します ---");
  
    const lotsSheet = new LotsSheet();
    const testVariantId = 'var_test_saba_M'; // テスト用の親バリアントID
    const testLotId = 'lot_test_saba_001';   // テスト用の固定ロットID
  
    // 事前準備：もしテストデータがあれば削除
    lotsSheet.deleteLot(testLotId);
    
    // 1. CREATE (ID指定)
    const newLotData = {
      lot_id: testLotId,
      variant_id: testVariantId,
      arrival_date: new Date(),
      actual_weight_kg: 5.5,
      package_count: 1
    };
    try {
      const created = lotsSheet.createLot(newLotData);
      Logger.log(`✅ 1.【CREATE】ロットを作成しました: ${created.lot_id}`);
    } catch(e) {
      Logger.log(`❌ 1.【CREATE】失敗: ${e.message}`);
    }
  
    // 2. CREATE (ID自動生成)
    const newLotDataAutoId = {
      variant_id: testVariantId,
      arrival_date: new Date(),
      actual_weight_kg: 2.1,
      package_count: 1
    };
    let autoGeneratedId = '';
    try {
      const created = lotsSheet.createLot(newLotDataAutoId);
      autoGeneratedId = created.lot_id;
      Logger.log(`✅ 2.【CREATE AutoID】ロットを自動生成IDで作成しました: ${autoGeneratedId}`);
    } catch(e) {
      Logger.log(`❌ 2.【CREATE AutoID】失敗: ${e.message}`);
    }
  
    // 3. READ by Variant ID
    try {
      const foundByVariant = lotsSheet.getLotsByVariantId(testVariantId);
      Logger.log(`✅ 3.【READ by Variant ID】'${testVariantId}'に紐づくロットを ${foundByVariant.length}件 取得しました。`);
    } catch(e) {
      Logger.log(`❌ 3.【READ by Variant ID】失敗: ${e.message}`);
    }
    
    // 4. UPDATE
    const updateData = {
      status: '出荷済',
      notes: 'テスト出荷完了'
    };
    try {
      const updated = lotsSheet.updateLot(testLotId, updateData);
      if (updated) {
        Logger.log(`✅ 4.【UPDATE】ロットを更新しました。新しいステータス: ${updated.status}`);
      } else {
        Logger.log(`❌ 4.【UPDATE】見つかりません。`);
      }
    } catch(e) {
      Logger.log(`❌ 4.【UPDATE】失敗: ${e.message}`);
    }
  
    // 5. DELETE
    try {
      const isDeleted1 = lotsSheet.deleteLot(testLotId);
      const isDeleted2 = lotsSheet.deleteLot(autoGeneratedId);
      if (isDeleted1 && isDeleted2) {
        Logger.log(`✅ 5.【DELETE】テストで作成した2件のロットを削除しました。`);
      } else {
        Logger.log(`❌ 5.【DELETE】削除に失敗しました。`);
      }
    } catch(e) {
      Logger.log(`❌ 5.【DELETE】失敗: ${e.message}`);
    }
  
    Logger.log("--- LotsSheetのテストを終了します ---");
  }