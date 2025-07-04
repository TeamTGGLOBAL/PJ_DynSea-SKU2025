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