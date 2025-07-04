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
  