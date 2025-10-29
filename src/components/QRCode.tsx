import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

 interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode = ({ value, size = 200 }: QRCodeProps) => {
  return (
    <Card className="p-8 inline-block bg-white">
      <div className="flex justify-center">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={true}        
        />
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3 font-mono break-all max-w-[200px]">
        {value.length > 30 ? `${value.substring(0, 30)}...` : value}
      </p>
    </Card>
  );
}; 

export default QRCode;



