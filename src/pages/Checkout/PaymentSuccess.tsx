import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data, error, isSuccess } = useQuery({
    queryKey: ["verify-session", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const res = await api.post("/payments/verify-session", { sessionId });
      return res.data;
    },
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (isSuccess && data?.success) {
      setOrderId(data.orderId);
      setVerifying(false);
      toast.success("Payment successful!");
      // Navigate to order details after short delay
      setTimeout(() => {
        navigate(`/orders/${data.orderId}`);
      }, 2000);
    } else if (error) {
      setVerifying(false);
      toast.error("Payment verification failed");
    }
  }, [isSuccess, data, error, navigate]);

  if (!sessionId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Request</h2>
          <p className="text-gray-500 mb-4">No session ID found</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
            <p className="text-gray-500">Please wait while we confirm your payment</p>
          </>
        ) : orderId ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">Order placed successfully. Redirecting...</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-gray-500 mb-4">Please contact support if payment was deducted</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
