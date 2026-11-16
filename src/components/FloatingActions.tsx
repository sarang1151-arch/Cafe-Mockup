import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '../data/cafeConfig';

export const FloatingActions: React.FC = () => {
  const location = useLocation();
  const onReservationsPage = location.pathname === '/reservations';

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2.5">
      <a
        href={`https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=Hello%20The%20Willow%20Caf%C3%A9%2C%20I%20would%20love%20to%20ask%20about%20a%20table%20or%20takeaway%20order.`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with The Willow Café on WhatsApp"
        title="WhatsApp Host Desk"
        className="w-11 h-11 rounded-full bg-[#1F2E26] text-[#F4EDE0] border border-[#F4EDE0]/15 hover:border-[#C9893B] shadow-lg flex items-center justify-center transition-transform duration-150 hover:-translate-y-0.5"
      >
        <MessageCircle className="w-4 h-4 text-[#9EB091]" />
      </a>

      {!onReservationsPage && (
        <Link
          to="/reservations"
          className="px-4 py-2.5 rounded-full bg-[#C9893B] hover:bg-[#DDA052] text-[#14100C] font-semibold text-xs shadow-lg flex items-center gap-2 transition-transform duration-150 hover:-translate-y-0.5 whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Reserve a Table</span>
        </Link>
      )}
    </div>
  );
};
