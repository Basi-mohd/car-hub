import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { bookingService } from '@/lib/services';
import { Booking } from '@/types';
import { Calendar as CalendarIcon, ArrowUpDown, Loader2 } from 'lucide-react';
import { addDays, format, isAfter, isBefore } from 'date-fns';

type SortKey = 'booking_number' | 'date' | 'time_slot' | 'customer_name' | 'vehicle_info' | 'service_type' | 'status' | 'price';

export default function AllBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getAll();
        setBookings(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (status !== 'all' && b.status !== status) return false;
        if (dateRange.from) {
          const d = new Date(b.date);
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          if (isBefore(d, start)) return false;
        }
        if (dateRange.to) {
          const d = new Date(b.date);
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (isAfter(d, end)) return false;
        }
        if (!term) return true;
        return (
          b.customer_name.toLowerCase().includes(term) ||
          b.service_type.toLowerCase().includes(term) ||
          b.time_slot.toLowerCase().includes(term) ||
          (b.payment_method ? b.payment_method.toLowerCase().includes(term) : false)
        );
      })
      .sort((a, b) => {
        let av: number | string = '';
        let bv: number | string = '';
        if (sortKey === 'date') {
          av = new Date(a.date).getTime();
          bv = new Date(b.date).getTime();
        } else {
          av = (a as any)[sortKey];
          bv = (b as any)[sortKey];
        }
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortAsc ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortAsc ? cmp : -cmp;
      });
  }, [bookings, search, status, dateRange, sortKey, sortAsc]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Bookings</h2>
        <p className="text-muted-foreground">Browse, search, filter, and sort all bookings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-3 mt-2 md:flex-row md:items-center">
              <Input
                placeholder="Search by customer, service, time, payment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-sm"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <span>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </span>
                      ) : (
                        <span>{format(dateRange.from, 'LLL dd, y')}</span>
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={(range: any) => setDateRange(range || {})}
                    numberOfMonths={2}
                    initialFocus
                  />
                  <div className="flex items-center gap-2 p-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>Clear</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: new Date(), to: addDays(new Date(), 7) })}>Next 7 days</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('booking_number')} aria-sort={sortKey==='booking_number'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Booking # <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('date')} aria-sort={sortKey==='date'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('time_slot')} aria-sort={sortKey==='time_slot'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Time <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('customer_name')} aria-sort={sortKey==='customer_name'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Customer <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('vehicle_info')} aria-sort={sortKey==='vehicle_info'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Vehicle <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('service_type')} aria-sort={sortKey==='service_type'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Service <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => onSort('status')} aria-sort={sortKey==='status'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => onSort('price')} aria-sort={sortKey==='price'?(sortAsc?'ascending':'descending'):'none'}>
                    <div className="inline-flex items-center gap-1 justify-end">Price <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">No bookings found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.booking_number}</TableCell>
                      <TableCell>{format(new Date(b.date), 'LLL dd, y')}</TableCell>
                      <TableCell>{b.time_slot}</TableCell>
                      <TableCell className="font-medium">{b.customer_name}</TableCell>
                      <TableCell>{b.vehicle_info}</TableCell>
                      <TableCell>{b.service_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{b.price}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


