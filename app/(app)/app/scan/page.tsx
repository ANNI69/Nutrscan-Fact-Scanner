"use client";
import {
  addScanHistory,
  checkProduct,
  getProductNutrients,
} from "@/(app)/actions";
import { ProductCard, Scanner, UploadBarcode } from "@/(app)/components";
import { ProductNutrients, Products } from "@prisma/client";
import { useState } from "react";

export default function Page() {
  const waitingState = 0,
    loadingState = 1,
    errorState = 2,
    successState = 3;
  const [state, setState] = useState(waitingState);
  const [product, setProduct] = useState<null | Products>(null);
  const [nutrients, setNutrients] = useState<null | ProductNutrients[]>(null);

  const handleDetectedBarcode = async (barcode: string) => {
    setState(loadingState);
    let result = await checkProduct(barcode);

    if (result === null) {
      setState(errorState);
      return;
    }

    let nutrients = await getProductNutrients(result.id);

    if (nutrients === null || nutrients.length === 0) {
      setState(errorState);
      return;
    }
    setProduct(result);
    setNutrients(nutrients);
    // Try to log history if user is logged in (silently ignore failures)
    try {
      await addScanHistory(result.id);
    } catch {}
    setState(successState);
  };

  // For testing scanning without actually scanning!
  // useEffect(() => {
  //   handleDetectedBarcode("00649094");
  // }, []);

  return (
    <div className="p-4">
      <Scanner handleResult={handleDetectedBarcode} />
      <UploadBarcode handleResult={handleDetectedBarcode} />
      <div className="bg-background">
        {state === loadingState && <p>Loading...</p>}
        {state === errorState && <p>Product does not Detected!</p>}
        {state === successState && product && nutrients && (
          <ProductCard product={product} nutrients={nutrients} />
        )}
      </div>
    </div>
  );
}
