import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Zap, MapPin, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { ElectricityData } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  data: ElectricityData[];
  onReset: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1', '#ec4899'];

export function Dashboard({ data, onReset }: DashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Get unique regions for filter
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(data.map(d => d.Regions).filter(Boolean)));
    return ['All', ...uniqueRegions];
  }, [data]);

  // Filter data based on selected region
  const filteredData = useMemo(() => {
    if (selectedRegion === 'All') return data;
    return data.filter(d => d.Regions === selectedRegion);
  }, [data, selectedRegion]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    const totalUsage = filteredData.reduce((sum, item) => sum + (item.Usage || 0), 0);
    const avgUsage = totalUsage / (filteredData.length || 1);
    
    // Find state with max usage
    const stateUsage = filteredData.reduce((acc, item) => {
      acc[item.States] = (acc[item.States] || 0) + (item.Usage || 0);
      return acc;
    }, {} as Record<string, number>);
    
    let maxState = '';
    let maxUsage = 0;
    Object.entries(stateUsage).forEach(([state, usage]) => {
      const usageNum = usage as number;
      if (usageNum > maxUsage) {
        maxUsage = usageNum;
        maxState = state;
      }
    });

    return {
      totalUsage: totalUsage.toFixed(2),
      avgUsage: avgUsage.toFixed(2),
      maxState,
      maxUsage: maxUsage.toFixed(2)
    };
  }, [filteredData]);

  // Aggregate data for Time Series
  const timeSeriesData = useMemo(() => {
    const dailyUsage = filteredData.reduce((acc, item) => {
      // Parse date assuming DD/MM/YYYY format based on sample
      let dateStr = item.Dates;
      if (dateStr && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Convert to YYYY-MM-DD for proper sorting
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      acc[dateStr] = (acc[dateStr] || 0) + (item.Usage || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyUsage)
      .map(([date, usage]) => ({ date, usage: Math.round((usage as number) * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Aggregate data for State Bar Chart
  const stateData = useMemo(() => {
    const usageByState = filteredData.reduce((acc, item) => {
      acc[item.States] = (acc[item.States] || 0) + (item.Usage || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(usageByState)
      .map(([state, usage]) => ({ state, usage: Math.round((usage as number) * 100) / 100 }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 15); // Top 15 states
  }, [filteredData]);

  // Aggregate data for Region Pie Chart
  const regionData = useMemo(() => {
    const usageByRegion = data.reduce((acc, item) => {
      if (!item.Regions) return acc;
      acc[item.Regions] = (acc[item.Regions] || 0) + (item.Usage || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(usageByRegion)
      .map(([name, value]) => ({ name, value: Math.round((value as number) * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onReset}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
              title="Upload new file"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Electricity Consumption Dashboard</h1>
              <p className="text-sm text-slate-500">India Regional Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Filter Region:</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Usage (MU)</p>
              <h3 className="text-2xl font-bold text-slate-900">{Number(summary.totalUsage).toLocaleString()}</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Daily Usage (MU)</p>
              <h3 className="text-2xl font-bold text-slate-900">{Number(summary.avgUsage).toLocaleString()}</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Highest Consuming State</p>
              <h3 className="text-xl font-bold text-slate-900 truncate max-w-[150px]" title={summary.maxState}>{summary.maxState || 'N/A'}</h3>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Data Points</p>
              <h3 className="text-2xl font-bold text-slate-900">{filteredData.length.toLocaleString()}</h3>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Series Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Consumption Trend Over Time</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    name="Usage (MU)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Region Pie Chart */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Usage by Region</h3>
            <div className="h-[350px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} MU`, 'Usage']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* State Bar Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Top 15 States by Consumption</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="state" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="usage" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Usage (MU)"
                  >
                    {stateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Data Table */}
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Recent Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">State</th>
                    <th className="px-6 py-3">Region</th>
                    <th className="px-6 py-3 text-right">Usage (MU)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredData]
                    .sort((a, b) => (b.Usage || 0) - (a.Usage || 0))
                    .slice(0, 10)
                    .map((row, idx) => (
                    <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.Dates}</td>
                      <td className="px-6 py-4">{row.States}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {row.Regions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{row.Usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 text-center text-xs text-slate-500">
              Showing top 10 highest usage records of {filteredData.length} total
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
