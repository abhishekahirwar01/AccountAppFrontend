// import React, { useState } from 'react';
// import axios from 'axios';

// // WhatsAppMessage component to send WhatsApp messages
// const WhatsAppMessage = ({ phoneNumber, message }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const sendMessage = async () => {
//     setLoading(true);
//     try {
//       // Make a POST request to your backend API
//       const response = await axios.post(
//         'http://localhost:8745/send-whatsapp',  // Replace with your backend API endpoint
//         {
//           phoneNumber,  // Send the phone number to the backend
//           message,      // Send the message to the backend
//         }
//       );
//       console.log('Message sent:', response.data);
//     } catch (error) {
//       console.error('Error sending WhatsApp message:', error);
//       setError('Failed to send message');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       {error && <div className="error">{error}</div>}
//       <button onClick={sendMessage} disabled={loading}>
//         {loading ? 'Sending...' : 'Send Invoice via WhatsApp'}
//       </button>
//     </div>
//   );
// };

// export default WhatsAppMessage;



















import React, { useState } from 'react';
import axios from 'axios';

const WhatsAppMessage = ({ phoneNumber, transactionDetails, onMessageSent }) => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${baseURL}/send-whatsapp`,
        {
          phoneNumber,
          transactionDetails,
          messageType: "detailed_invoice"
        }
      );
      
      console.log('Message sent:', response.data);
      
      if (onMessageSent) {
        onMessageSent(true, "Invoice sent successfully via WhatsApp");
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setError('Failed to send invoice message');
      
      if (onMessageSent) {
        onMessageSent(false, "Failed to send invoice via WhatsApp");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-message-container">
      {error && <div className="error text-red-500 text-sm mb-2">{error}</div>}
      <button 
        onClick={sendMessage} 
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400"
      >
        {loading ? 'Sending Invoice...' : 'Send Invoice via WhatsApp'}
      </button>
    </div>
  );
};

export default WhatsAppMessage;