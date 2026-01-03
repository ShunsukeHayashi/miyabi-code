/**
 * Enrollment Modal Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  Gift,
  Check,
  Clock,
  BookOpen,
  Award,
  Users,
  Star,
  Shield,
  RefreshCw
} from 'lucide-react';
import { CourseWithRelations } from '../shared/types';

interface EnrollmentModalProps {
  course: CourseWithRelations;
  onClose: () => void;
  onEnroll: () => void;
  className?: string;
}

export function EnrollmentModal({
  course,
  onClose,
  onEnroll,
  className = ''
}: EnrollmentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'free' | 'stripe' | 'paypal'>('free');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  const isFree = !course.price || course.price === 0;

  const formatPrice = (price?: number | null) => {
    if (!price || price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const calculateFinalPrice = () => {
    let finalPrice = Number(course.price) || 0;

    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        finalPrice = finalPrice * (1 - appliedCoupon.discount / 100);
      } else {
        finalPrice = Math.max(0, finalPrice - appliedCoupon.discount);
      }
    }

    return finalPrice;
  };

  const applyCoupon = () => {
    // Mock coupon validation
    const validCoupons = {
      'WELCOME20': { discount: 20, type: 'percentage' as const },
      'STUDENT50': { discount: 50, type: 'fixed' as const },
    };

    const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        ...coupon
      });
    } else {
      // Show error
      alert('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleEnroll = async () => {
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!isFree && step === 'details') {
        setStep('payment');
        setIsProcessing(false);
        return;
      }

      onEnroll();
      setStep('confirmation');
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalPrice = calculateFinalPrice();
  const savings = Number(course.price) - finalPrice;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`
        bg-gray-900 rounded-xl border border-gray-700 shadow-2xl
        max-w-2xl w-full max-h-[90vh] overflow-y-auto
        ${className}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {step === 'confirmation' ? 'Enrollment Successful!' : 'Enroll in Course'}
              </h2>
              <p className="text-gray-400">{course.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Course Summary */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">What's included:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">
                      {course.stats?.lessonsCount || 0} lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">
                      {Math.floor((course.estimatedTime || 0) / 60)}h of content
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">Community access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RefreshCw size={16} className="text-miyabi-blue flex-shrink-0" />
                    <span className="text-gray-300">30-day money-back guarantee</span>
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">Your Instructor</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-white">
                      {(course.creator.displayName || course.creator.username || 'I')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {course.creator.displayName || course.creator.username}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span>4.8 instructor rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              {!isFree && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="font-semibold text-white mb-4">Pricing</h3>

                  {/* Coupon Code */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Have a coupon code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <button
                          onClick={removeCoupon}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={applyCoupon}
                          disabled={!couponCode.trim()}
                          className="px-4 py-2 bg-miyabi-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <div className="flex justify-between text-gray-300">
                      <span>Course price:</span>
                      <span>{formatPrice(course.price)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-green-400">
                        <span>Coupon ({appliedCoupon.code}):</span>
                        <span>-{formatPrice(savings)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-600">
                      <span>Total:</span>
                      <span>{formatPrice(finalPrice)}</span>
                    </div>

                    {savings > 0 && (
                      <div className="text-green-400 text-sm">
                        You save {formatPrice(savings)}!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && !isFree && (
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-miyabi-blue transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="text-miyabi-blue focus:ring-miyabi-blue"
                    />
                    <CreditCard size={20} className="text-gray-400" />
                    <span className="text-white">Credit Card</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-miyabi-blue transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="text-miyabi-blue focus:ring-miyabi-blue"
                    />
                    <DollarSign size={20} className="text-gray-400" />
                    <span className="text-white">PayPal</span>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-semibold text-white mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>{course.title}</span>
                    <span>{formatPrice(finalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-600">
                    <span>Total:</span>
                    <span>{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-white" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Welcome to the course!
                </h3>
                <p className="text-gray-300">
                  You've successfully enrolled in "{course.title}".
                  You can now access all course content and start learning.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="font-semibold text-white mb-4">What's next?</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-miyabi-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <span className="text-gray-300">Start with the first lesson</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-miyabi-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <span className="text-gray-300">Join the course community</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-miyabi-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <span className="text-gray-300">Complete assignments and earn your certificate</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'confirmation' && (
          <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {!isFree && (
                  <>
                    30-day money-back guarantee
                    <br />
                    Secure payment processing
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                {step === 'payment' && (
                  <button
                    onClick={() => setStep('details')}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}

                <button
                  onClick={handleEnroll}
                  disabled={isProcessing}
                  className="
                    bg-miyabi-purple text-white px-8 py-3 rounded-lg font-semibold
                    hover:bg-purple-600 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {isFree ? 'Enroll for Free' : step === 'details' ? 'Continue to Payment' : `Pay ${formatPrice(finalPrice)}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="bg-gray-900 border-t border-gray-700 p-6 rounded-b-xl text-center">
            <button
              onClick={onClose}
              className="bg-miyabi-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnrollmentModal;