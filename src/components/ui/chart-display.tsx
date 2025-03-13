
import { ChartData as ChartDataType } from "@/types/chat";
import { useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartDisplayProps {
  chartData: ChartDataType;
}

export function ChartDisplay({ chartData }: ChartDisplayProps) {
  const { type, data, options, title, description } = chartData;
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-fade-in");
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(chartRef.current);
      return () => {
        if (chartRef.current) {
          observer.unobserve(chartRef.current);
        }
      };
    }
  }, []);

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.datasets ? undefined : data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={data.datasets ? undefined : "name"} 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #f0f0f0',
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              {data.datasets ? (
                data.datasets.map((dataset: any, index: number) => (
                  <Bar
                    key={index}
                    dataKey={(datum: any) => datum}
                    name={dataset.label}
                    data={dataset.data}
                    fill={dataset.backgroundColor || "#3b82f6"}
                  >
                    {dataset.data.map((_: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          Array.isArray(dataset.backgroundColor) 
                            ? dataset.backgroundColor[index % dataset.backgroundColor.length] 
                            : dataset.backgroundColor || "#3b82f6"
                        } 
                      />
                    ))}
                  </Bar>
                ))
              ) : (
                <Bar dataKey="value" fill="#3b82f6" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      [
                        "#3b82f6",
                        "#10b981",
                        "#f97316",
                        "#d946ef",
                        "#f59e0b",
                        "#06b6d4",
                        "#8b5cf6",
                      ][index % 7]
                    }
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="x" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis dataKey="y" name="y" tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '0.375rem',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              <Scatter name="Data Points" data={data} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div
      ref={chartRef}
      className="w-full rounded-lg overflow-hidden border border-border bg-card text-card-foreground shadow-sm opacity-0"
    >
      {title && (
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="p-4">{renderChart()}</div>
    </div>
  );
}
