"use client";

import { checkProduct } from "@/(app)/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UploadBarcode from "./UploadBarcode";

export default function HomeUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResult = async (barcode: string) => {
    try {
      setLoading(true);
      const product = await checkProduct(barcode);
      const target = product?.barcode
        ? `/app/product/${product.barcode}`
        : "/app";
      router.push(target);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <UploadBarcode handleResult={handleResult} />
    </div>
  );
}
