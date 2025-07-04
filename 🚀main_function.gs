/**
 * ProductSheetクラスの動作をテストするためのメイン関数
 */
function main_testProductSheet() {
    Logger.log("--- ProductSheetのテストを開始します ---");
  
    // 1. クラスのインスタンス化
    let productSheet;
    try {
      productSheet = new ProductSheet();
      Logger.log("✅ 1. ProductSheetのインスタンス化に成功しました。");
    } catch (e) {
      Logger.log(`❌ 1. ProductSheetのインスタンス化に失敗しました: ${e.message}`);
      return; // テスト中断
    }
  
    // 2.【CREATE】新しい製品の作成
    const newProductId = 'prod_test_sake';
    const newProductData = {
      product_id: newProductId,
      product_name: 'テスト用の鮭',
      default_origin_id: 'org_hokkaido',
      category_id: 'cat_fresh'
    };
  
    try {
      // もしテスト用のデータが残っていたら、まず削除する
      productSheet.deleteProduct(newProductId);
  
      const createdProduct = productSheet.createProduct(newProductData);
      Logger.log(`✅ 2.【CREATE】製品を作成しました: ${JSON.stringify(createdProduct)}`);
    } catch (e) {
      Logger.log(`❌ 2.【CREATE】製品の作成に失敗しました: ${e.message}`);
    }
  
    // 3.【READ】全製品の取得
    try {
      const allProducts = productSheet.getAllProducts();
      Logger.log(`✅ 3.【READ】全製品を取得しました。件数: ${allProducts.length}件`);
      // Logger.log(allProducts); // 全件表示はログが長くなるのでコメントアウト
    } catch(e) {
      Logger.log(`❌ 3.【READ】全製品の取得に失敗しました: ${e.message}`);
    }
  
    // 4.【READ】ID指定での製品取得
    try {
      const foundProduct = productSheet.getProductById(newProductId);
      if (foundProduct) {
        Logger.log(`✅ 4.【READ】ID指定で製品を取得しました: ${JSON.stringify(foundProduct)}`);
      } else {
        Logger.log(`❌ 4.【READ】ID指定で製品が見つかりませんでした。ID: ${newProductId}`);
      }
    } catch(e) {
      Logger.log(`❌ 4.【READ】ID指定での製品取得に失敗しました: ${e.message}`);
    }
  
    // 5.【UPDATE】製品の更新
    const updateData = {
      description: 'これは更新テスト用の説明文です。',
      notes: '更新が成功しました。'
    };
    try {
      const updatedProduct = productSheet.updateProduct(newProductId, updateData);
      if (updatedProduct) {
        Logger.log(`✅ 5.【UPDATE】製品を更新しました: ${JSON.stringify(updatedProduct)}`);
      } else {
        Logger.log(`❌ 5.【UPDATE】更新対象の製品が見つかりませんでした。ID: ${newProductId}`);
      }
    } catch (e) {
      Logger.log(`❌ 5.【UPDATE】製品の更新に失敗しました: ${e.message}`);
    }
  
    // 6.【DELETE】製品の削除
    try {
      const isDeleted = productSheet.deleteProduct(newProductId);
      if (isDeleted) {
        Logger.log(`✅ 6.【DELETE】製品を削除しました。ID: ${newProductId}`);
      } else {
        Logger.log(`❌ 6.【DELETE】削除対象の製品が見つかりませんでした。ID: ${newProductId}`);
      }
    } catch (e) {
      Logger.log(`❌ 6.【DELETE】製品の削除に失敗しました: ${e.message}`);
    }
  
    Logger.log("--- ProductSheetのテストを終了します ---");
  }