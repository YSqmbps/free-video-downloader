import { Check, Zap, Crown, Star } from 'lucide-react';
import { pricingPlans } from '../data/platforms';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            定价方案
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            选择适合你的方案
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            从免费版开始，随时升级解锁更多高级功能
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 transition-all duration-300 card-hover ${
                plan.popular
                  ? 'bg-gradient-primary text-white shadow-xl shadow-primary-500/20 scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    最受欢迎
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                {plan.id === 'free' && (
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                {plan.id === 'pro' && (
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                )}
                {plan.id === 'vip' && (
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-900" />
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
              </div>

              <div className="mb-6">
                <span
                  className={`text-4xl font-bold ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.price === 0 ? '免费' : `¥${plan.price}`}
                </span>
                <span
                  className={`text-sm ${
                    plan.popular ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  /{plan.period}
                </span>
              </div>

              <p
                className={`text-sm mb-6 ${
                  plan.popular ? 'text-white/80' : 'text-gray-600'
                }`}
              >
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.popular ? 'bg-white/20' : 'bg-green-100'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.popular ? 'text-white' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        plan.popular ? 'text-white/90' : 'text-gray-700'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/pricing')}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-primary-600 hover:bg-gray-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                立即订阅
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
