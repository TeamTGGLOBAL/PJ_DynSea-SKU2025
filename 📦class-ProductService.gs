/**
 * @class ProductService
 * @description 商品関連のビジネスロジックを集約し、階層化されたデータを提供するサービスクラス
 */
class ProductService {
    /**
     * @constructor
     */
    constructor() {
      // 各シート操作クラスをインスタンス化して保持
      this.productSheet = new ProductSheet();
      this.variantsSheet = new VariantsSheet();
      this.lotsSheet = new LotsSheet();
      
      // 各種マスタも必要に応じてここでインスタンス化しておく
      // this.originsSheet = new OriginsSheet();
      // this.qualitiesSheet = new QualitiesSheet();
      // ...など
    }
  
    /**
     * 指定されたproductIdに基づいて、関連する全ての情報を階層化したJSONオブジェクトを生成する
     * @param {string} productId - 取得したい商品のID
     * @returns {Object|null} 階層化された製品オブジェクト、または見つからない場合はnull
     */
    getProductWithDetails(productId) {
      // 1. 親（Product）のデータを取得
      const product = this.productSheet.getProductById(productId);
      if (!product) {
        Logger.log(`製品が見つかりません: ${productId}`);
        return null;
      }
  
      // 2. 子（Variants）のデータを取得
      const variants = this.variantsSheet.getVariantsByProductId(productId);
      if (!variants || variants.length === 0) {
        product.variants = []; // バリアントがない場合も空配列を持たせる
        return product;
      }
  
      // 3. 孫（Lots）のデータを効率的に取得するためにMapを作成
      // 全てのロットを一度に取得し、variant_idでグループ化する
      const allLots = this.lotsSheet.getAllLots();
      const lotsMap = allLots.reduce((map, lot) => {
        if (!map[lot.variant_id]) {
          map[lot.variant_id] = [];
        }
        map[lot.variant_id].push(lot);
        return map;
      }, {});
  
      // 4. 各バリアントにロットを紐付け、在庫情報を計算する
      product.variants = variants.map(variant => {
        const relatedLots = lotsMap[variant.variant_id] || [];
        
        // バリアントにロットのリストを追加
        variant.lots = relatedLots;
  
        // 在庫情報を計算して追加
        const stockLots = relatedLots.filter(lot => lot.status === '在庫');
        variant.stock_info = {
          total_package_count: stockLots.reduce((sum, lot) => sum + (Number(lot.package_count) || 0), 0),
          total_actual_weight_kg: stockLots.reduce((sum, lot) => sum + (Number(lot.actual_weight_kg) || 0), 0),
        };
        
        return variant;
      });
  
      return product;
    }
  
    /**
     * getProductWithDetailsの結果を整形されたJSON文字列として返す
     * @param {string} productId - 取得したい商品のID
     * @returns {string|null} 整形されたJSON文字列、または見つからない場合はnull
     */
    getProductJsonById(productId) {
      const productObject = this.getProductWithDetails(productId);
      if (!productObject) {
        return null;
      }
      return JSON.stringify(productObject, null, 2); // インデント付きで見やすくする
    }
  }
  
  /**
   * ProductServiceクラスの動作をテストするための関数
   * 実行前に、テスト用のデータが各シートに存在することを確認してください。
   * - 01_products: product_id = 'prod_test_hirame'
   * - 02_variants: product_id = 'prod_test_hirame' に紐づく variant_id = 'var_test_hirame_L_A_katsu'
   * - 03_lots: variant_id = 'var_test_hirame_L_A_katsu' に紐づくロットデータ数件
   */
  function main_testProductService() {
    Logger.log("--- ProductServiceのテストを開始します ---");
  
    // --- テストデータの準備 ---
    const productService = new ProductService();
    const testProductId = 'prod_test_hirame';
    const testVariantId = 'var_test_hirame_L_A_katsu';
  
    // テストデータをクリーンにする（既存のテストデータを削除）
    productService.productSheet.deleteProduct(testProductId);
    
    // 親Productの作成
    productService.productSheet.createProduct({ product_id: testProductId, product_name: 'テスト用ヒラメ' });
    
    // 子Variantの作成
    productService.variantsSheet.createVariant({
      variant_id: testVariantId,
      product_id: testProductId,
      variant_name: 'テスト用ヒラメ 大(A品/活締)'
    });
  
    // 孫Lotの作成（在庫2件、出荷済1件）
    productService.lotsSheet.createLot({
      variant_id: testVariantId,
      status: '在庫',
      package_count: 1,
      actual_weight_kg: 1.2
    });
    productService.lotsSheet.createLot({
      variant_id: testVariantId,
      status: '在庫',
      package_count: 1,
      actual_weight_kg: 1.3
    });
    productService.lotsSheet.createLot({
      variant_id: testVariantId,
      status: '出荷済',
      package_count: 1,
      actual_weight_kg: 1.1
    });
    Logger.log("✅ テストデータの準備が完了しました。");
    // --- テストデータの準備 完了 ---
  
  
    // --- テストの実行 ---
    try {
      const jsonOutput = productService.getProductJsonById(testProductId);
      if (jsonOutput) {
        Logger.log(`✅ 階層JSONの生成に成功しました。`);
        Logger.log(jsonOutput); // 生成されたJSONをログに出力
  
        // 簡単な内容チェック
        const result = JSON.parse(jsonOutput);
        if (result.variants[0].stock_info.total_package_count === 2) {
          Logger.log("✅ 在庫数の計算（2件）も正しいです。");
        } else {
          Logger.log(`❌ 在庫数の計算が不正です。期待値: 2, 結果: ${result.variants[0].stock_info.total_package_count}`);
        }
  
      } else {
        Logger.log(`❌ 階層JSONの生成に失敗しました。製品が見つかりません。`);
      }
    } catch (e) {
      Logger.log(`❌ テスト実行中にエラーが発生しました: ${e.message}\n${e.stack}`);
    }
  
    // --- テストデータのクリーンアップ ---
    // テストで作成したロットを削除
    const lots = productService.lotsSheet.getLotsByVariantId(testVariantId);
    lots.forEach(lot => productService.lotsSheet.deleteLot(lot.lot_id));
    // テストで作成したバリアントを削除
    productService.variantsSheet.deleteVariant(testVariantId);
    // テストで作成した製品を削除
    productService.productSheet.deleteProduct(testProductId);
    Logger.log("✅ テストデータのクリーンアップが完了しました。");
  
    Logger.log("--- ProductServiceのテストを終了します ---");
  }