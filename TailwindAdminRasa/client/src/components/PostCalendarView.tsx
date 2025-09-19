import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/vi'; // Vietnamese locale
import { ScheduledPost, SocialAccount } from '../../../shared/schema';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Facebook, 
  Instagram, 
  Edit,
  Eye,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Set up moment localizer with Vietnamese
moment.locale('vi');
const localizer = momentLocalizer(moment);

// Enable drag and drop
const DragAndDropCalendar = withDragAndDrop(Calendar);
type CalendarProps = React.ComponentProps<typeof Calendar>;
const RBCalendar = DragAndDropCalendar as unknown as React.ComponentType<CalendarProps & {
  onEventDrop: (args: { event: CalendarEvent; start: Date; end: Date }) => void;
  onEventResize: (args: { event: CalendarEvent; start: Date; end: Date }) => void;
}>;

interface PostCalendarViewProps {
  posts: ScheduledPost[];
  accounts: SocialAccount[];
  onEditPost: (post: ScheduledPost) => void;
  onTriggerPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onCreatePost: (date: Date) => void;
  onReschedulePost: (postId: string, newDate: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledPost;
}

export function PostCalendarView({
  posts,
  accounts,
  onEditPost,
  onTriggerPost,
  onDeletePost,
  onCreatePost,
  onReschedulePost
}: PostCalendarViewProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());

  // Convert posts to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return posts.map(post => {
      const account = accounts.find(acc => acc.id === post.socialAccountId);
      const startDate = new Date(post.scheduledTime);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration
      
      return {
        id: post.id,
        title: account?.name || 'Unknown Account',
        start: startDate,
        end: endDate,
        resource: post
      };
    });
  }, [posts, accounts]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-3 h-3 text-blue-600" />;
      case 'instagram': return <Instagram className="w-3 h-3 text-pink-500" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-3 h-3 text-blue-500" />;
      case 'posting': return <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />;
      case 'posted': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <Edit className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'scheduled': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'posting': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'posted': return 'bg-green-100 border-green-300 text-green-700';
      case 'failed': return 'bg-red-100 border-red-300 text-red-700';
      case 'cancelled': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const post = event.resource;
    const account = accounts.find(acc => acc.id === post.socialAccountId);
    
    return (
      <div className={`px-1 py-0.5 rounded text-xs border ${getStatusColor(post.status)}`}>
        <div className="flex items-center gap-1 mb-0.5">
          {getPlatformIcon(post.platform)}
          {getStatusIcon(post.status)}
          <span className="font-medium truncate">{account?.name}</span>
        </div>
        <div className="truncate text-xs opacity-90">
          {post.caption.substring(0, 30)}...
        </div>
      </div>
    );
  };

  // Handle date/time selection for creating new posts
  const handleSelectSlot = ({ start }: { start: Date }) => {
    onCreatePost(start);
  };

  // Handle event selection for editing posts
  const handleSelectEvent = (event: CalendarEvent) => {
    onEditPost(event.resource);
  };

  // Handle drag and drop for rescheduling
  const handleEventDrop = ({ event, start }: { event: CalendarEvent; start: Date; end: Date }) => {
    onReschedulePost(event.resource.id, start);
  };

  const handleEventResize = ({ event, start }: { event: CalendarEvent; start: Date; end: Date }) => {
    onReschedulePost(event.resource.id, start);
  };

  // Custom toolbar
  const CustomToolbar = (props: any) => {
    const { label, onNavigate, onView } = props;
    
    return (
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            ← Trước
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
          <button
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Sau →
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Hôm nay
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {['month', 'week', 'day'].map((viewName) => (
            <button
              key={viewName}
              onClick={() => onView(viewName)}
              className={`px-3 py-1 rounded-md transition-colors ${
                props.view === viewName
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {viewName === 'month' ? 'Tháng' : viewName === 'week' ? 'Tuần' : 'Ngày'}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="h-[600px]">
        <RBCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view as any}
          onView={(newView: any) => setView(newView as any)}
          date={date}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          popup
          resizable
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          messages={{
            next: 'Tiếp',
            previous: 'Trước',
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            agenda: 'Lịch trình',
            date: 'Ngày',
            time: 'Thời gian',
            event: 'Sự kiện',
            noEventsInRange: 'Không có bài đăng nào trong khoảng thời gian này.',
            showMore: (total: number) => `+${total} bài khác`
          }}
          formats={{
            monthHeaderFormat: 'MMMM YYYY',
            dayHeaderFormat: 'dddd, DD/MM/YYYY',
            weekdayFormat: 'ddd',
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
          }}
          style={{ height: '100%' }}
          className="rbc-calendar-vietnamese"
        />
      </div>
      
      {/* Custom CSS for better styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar-vietnamese {
          font-family: 'Inter', sans-serif;
        }
        
        .rbc-calendar-vietnamese .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .rbc-calendar-vietnamese .rbc-header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px;
          font-weight: 600;
          color: #374151;
        }
        
        .rbc-calendar-vietnamese .rbc-date-cell {
          padding: 4px;
          text-align: right;
        }
        
        .rbc-calendar-vietnamese .rbc-today {
          background-color: #dbeafe;
        }
        
        .rbc-calendar-vietnamese .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .rbc-calendar-vietnamese .rbc-event {
          background: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 1px 0 !important;
        }
        
        .rbc-calendar-vietnamese .rbc-selected {
          background-color: #3b82f6 !important;
        }
        
        .rbc-calendar-vietnamese .rbc-slot-selection {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
      `}} />
    </div>
  );
}