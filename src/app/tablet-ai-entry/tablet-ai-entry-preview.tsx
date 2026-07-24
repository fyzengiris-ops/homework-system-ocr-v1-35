'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ChevronLeft,
  ChevronDown,
  Check,
  CirclePlus,
  Clock3,
  EllipsisVertical,
  FileText,
  Image as ImageIcon,
  Images,
  Layers as LayersIcon,
  MessageCircle,
  Mic2,
  Minus,
  Plus,
  Search,
  SendHorizonal,
  Trash2,
  X,
} from 'lucide-react';
import { getValidQuestionTypes } from '@/lib/ai-recognizer';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1200;
const OCR_BOX_SELECT_ICON_SAFE_WIDTH = 24;
const MATERIAL_PAGE_MAX_WIDTH = 890;
const MATERIAL_PAGE_MAX_HEIGHT = 830;
const REVIEW_QUESTION_IMAGE_MAX_WIDTH = 760;

type SelectedImage = {
  name: string;
  url: string;
  role?: ImageRole;
};

type RecognitionMode = 'questions_only' | 'same_image_answer' | 'separate_answer';
type ImageRole = 'question' | 'answer';
type SubjectMode = 'single' | 'multiple';
type OcrDetectStatus = 'loading' | 'ready' | 'failed';
type CaptureCloseTarget = 'mode' | 'content' | 'upload' | null;
type ReviewDisplayMode = 'recognition' | 'image';
type ReviewQuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank' | 'short_answer' | 'material' | 'judge';
type QuestionTypeRecognitionStatus = 'pending' | 'recognized' | 'failed' | 'manual' | 'stale';
type CropDragAction = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-w' | 'resize-e';

type MaterialPage = SelectedImage & {
  pageNumber: number;
  naturalWidth: number;
  naturalHeight: number;
  imageData: string;
};

type RecognitionBox = {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  source: 'system' | 'manual';
};

type TabletConfirmAction = 'replace' | 'clear' | null;
type CropRegion = { x: number; y: number; width: number; height: number };

type ReviewQuestion = {
  id: string;
  pageNumber: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  questionType: ReviewQuestionType;
  questionTypeStatus: QuestionTypeRecognitionStatus;
  optionCount: number;
  blankCount: number;
  subQuestions: Array<{
    id: string;
    questionType: ReviewQuestionType;
    optionCount: number;
    blankCount: number;
  }>;
  viewMode: ReviewDisplayMode;
  croppedImageData?: string;
  croppedImageHeight?: number;
  croppedImageWidth?: number;
  userCroppedImageData?: string;
};

type ReviewAiMatchedQuestion = {
  questionBoxId?: string;
  questionType?: string;
  optionCount?: number;
  blankCount?: number;
  subQuestions?: Array<{
    questionType?: string;
    optionCount?: number;
    blankCount?: number;
  }>;
};

const SINGLE_SUBJECT = '高中数学';

const reviewQuestionTypeOptions: Array<{ value: ReviewQuestionType; label: string }> = [
  { value: 'single_choice', label: '单选题' },
  { value: 'multiple_choice', label: '多选题' },
  { value: 'fill_blank', label: '填空题' },
  { value: 'short_answer', label: '问答题' },
  { value: 'material', label: '材料题' },
  { value: 'judge', label: '判断题' },
];

function mapRecognizedQuestionType(questionType: string | undefined): ReviewQuestionType {
  const normalizedType = questionType || '';
  if (normalizedType.includes('单选')) return 'single_choice';
  if (normalizedType.includes('多选')) return 'multiple_choice';
  if (normalizedType.includes('填空') || normalizedType.includes('空')) return 'fill_blank';
  if (
    normalizedType.includes('材料') ||
    normalizedType.includes('综合') ||
    normalizedType.includes('阅读理解') ||
    normalizedType.includes('完形填空') ||
    normalizedType.includes('任务型阅读')
  ) return 'material';
  if (normalizedType.includes('判断')) return 'judge';
  return 'short_answer';
}

function getDefaultOptionCount(questionType: ReviewQuestionType, optionCount?: number) {
  if (questionType === 'multiple_choice' || questionType === 'single_choice') return optionCount || 4;
  return 4;
}

function getDefaultBlankCount(questionType: ReviewQuestionType, blankCount?: number) {
  if (questionType === 'fill_blank') return blankCount || 1;
  return 1;
}

const assignments = [
  {
    date: '2026-06-10作业',
    name: '乡土中国：《无为政治》《长老统治》配套练...',
    tags: ['课前'],
  },
  {
    date: '2026-06-03作业',
    name: '高一数学第一章 集合练习',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-08作业',
    name: '2026年4月20日19时组卷',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-02作业',
    name: '阶段同步练习',
    tags: ['课后'],
  },
];

const subjects = [
  '小学语文',
  '小学数学',
  '小学英语',
  '初中语文',
  '初中英语',
  '高中语文',
  '高中数学',
  '高中英语',
  '高中物理',
  '高中化学',
  '高中生物',
  '高中政治',
  '高中历史',
  '高中地理',
];

function useCanvasScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const nextScale = Math.min(
        window.innerWidth / CANVAS_WIDTH,
        window.innerHeight / CANVAS_HEIGHT,
        1,
      );
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
}

function TrialFileIcon() {
  return (
    <div className="relative h-[96px] w-[82px]">
      <FileText className="absolute left-0 top-0 h-[96px] w-[82px] stroke-[1.4] text-slate-200" />
      <div className="absolute bottom-[14px] left-[29px] rounded-[5px] bg-[#10b981] px-[9px] py-[5px] text-[18px] font-semibold leading-none text-white">
        试卷
      </div>
    </div>
  );
}

function AssignmentBlock({
  date,
  name,
  tags,
  top,
}: {
  date: string;
  name: string;
  tags: string[];
  top: number;
}) {
  return (
    <section
      className="absolute left-[31px] h-[294px] w-[935px] rounded-[2px] bg-white"
      style={{ top }}
    >
      <div className="absolute left-[29px] top-[27px] rounded-full bg-[#b9b9b9] px-[22px] py-[8px] text-[22px] font-medium leading-none text-white">
        已结束
      </div>
      <h2 className="absolute left-[186px] top-[28px] text-[31px] font-bold leading-none text-[#202124]">
        {date}
      </h2>
      <div className="absolute left-[30px] top-[96px] h-[169px] w-[900px] rounded-[7px] border border-[#ececec] bg-white">
        <div className="absolute left-[42px] top-[34px]">
          <TrialFileIcon />
        </div>
        <div className="absolute left-[153px] top-[36px] flex max-w-[640px] items-center gap-[16px]">
          <p className="truncate text-[29px] leading-none text-[#505050]">{name}</p>
          {tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-[#f1f1f1] px-[22px] py-[10px] text-[21px] leading-none text-[#606060]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute left-[153px] top-[106px] flex items-center gap-[32px] text-[24px] leading-none text-[#868686]">
          <span>
            提交人数： <strong className="font-medium text-[#45c9a6]">1/71</strong>
          </span>
          <span>
            批改人数： <strong className="font-medium text-[#45c9a6]">0/1</strong>
          </span>
          <span>
            正确率： <strong className="font-medium text-[#555]">0%</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function RobotMark() {
  return (
    <div className="relative h-[62px] w-[64px]">
      <img
        alt="AI小乐"
        className="h-full w-full object-contain"
        src="/ai-mascot.jpg"
      />
    </div>
  );
}

function QuickButton({
  children,
  top,
  onClick,
}: {
  children: React.ReactNode;
  top: number;
  onClick?: () => void;
}) {
  return (
    <button
      className="absolute left-[88px] h-[60px] rounded-[8px] border border-[#dcdcdc] bg-white px-[14px] text-left text-[24px] leading-none text-[#2f2f2f] active:bg-[#f6f6f6]"
      onClick={onClick}
      style={{ top }}
      type="button"
    >
      {children}
    </button>
  );
}

function HomeworkPanel() {
  return (
    <div className="absolute left-0 top-0 h-[1200px] w-[966px] overflow-hidden bg-[#f4f4f4]">
      <div className="absolute left-0 top-0 h-[107px] w-[966px] bg-[#59ce91]">
        <div className="absolute left-[22px] top-[8px] flex items-center gap-[14px] text-[23px] font-semibold text-white">
          <span>4:39</span>
          <ImageIcon className="h-[20px] w-[20px] fill-white/90 stroke-white/90" />
        </div>
        <div className="absolute left-[42px] top-[56px] flex items-center gap-[26px] text-[29px] font-medium text-white/90">
          <ChevronLeft className="h-[31px] w-[31px]" />
          <span>返回</span>
          <span>关闭</span>
        </div>
        <div className="absolute right-[3px] top-[57px] text-[31px] font-medium text-white/80">
          作业
        </div>
      </div>

      <div className="absolute left-0 top-[107px] h-[109px] w-[966px] bg-white">
        <div className="absolute right-[65px] top-[29px] text-[30px] font-bold leading-none text-[#202124]">
          待批改(50)
        </div>
        <div className="absolute right-[66px] top-[79px] h-[5px] w-[58px] rounded-full bg-[#58cf9a]" />
      </div>

      {assignments.map((assignment, index) => (
        <AssignmentBlock
          key={assignment.date}
          {...assignment}
          top={216 + index * 316}
        />
      ))}

      <div className="absolute bottom-[48px] left-[792px] h-[83px] w-[232px] rounded-full bg-[#58d297] text-center text-[34px] font-medium leading-[83px] text-white">
        布置
      </div>
    </div>
  );
}

function SelectedImageCard({ image }: { image: SelectedImage }) {
  const roleLabel = image.role === 'question' ? '题目' : image.role === 'answer' ? '答案' : '图片';
  const roleClass = image.role === 'answer' ? 'bg-[#5d82f3]' : image.role === 'question' ? 'bg-[#10b981]' : 'bg-[#ff5f60]';

  return (
    <div className="flex h-[86px] w-[330px] items-center gap-[14px] rounded-[10px] border border-[#e8e8e8] bg-white px-[14px]">
      <img
        alt=""
        className="h-[58px] w-[58px] shrink-0 rounded-[6px] object-cover"
        src={image.url}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[21px] leading-none text-[#303030]">
          {image.name}
        </div>
        <div className={`mt-[10px] rounded-[4px] px-[7px] py-[4px] text-[15px] font-medium leading-none text-white w-fit ${roleClass}`}>
          {roleLabel}
        </div>
      </div>
    </div>
  );
}

function SubjectSelectionPanel({
  onSubjectSelect,
  selectedSubject,
}: {
  onSubjectSelect: (subject: string) => void;
  selectedSubject: string;
}) {
  return (
    <>
      <div className="absolute left-[22px] top-[345px]">
        <RobotMark />
      </div>
      <div className="absolute left-[106px] top-[354px] h-[76px] w-[600px] rounded-[8px] bg-[#f7f8fb] px-[22px] py-[18px] text-[24px] leading-[40px] text-[#303030]">
        请先选择这次识别资料的学段学科
      </div>
      <div className="absolute left-[88px] top-[468px] grid w-[780px] grid-cols-4 gap-[16px]">
        {subjects.map((subject) => (
          <button
            key={subject}
            className={`h-[58px] rounded-[8px] border text-[22px] leading-none active:bg-[#f6f6f6] ${
              selectedSubject === subject
                ? 'border-[#58cf9a] bg-[#eefaf4] text-[#20a874]'
                : 'border-[#dedede] bg-white text-[#333]'
            }`}
            onClick={() => onSubjectSelect(subject)}
            type="button"
          >
            {subject}
          </button>
        ))}
      </div>
    </>
  );
}

function AiPanel({
  onSubjectSelect,
  isSubjectPickerOpen,
  onUserModeChange,
  selectedSubject,
  userMode,
  onOpenUpload,
}: {
  onSubjectSelect: (subject: string) => void;
  isSubjectPickerOpen: boolean;
  onUserModeChange: (mode: SubjectMode) => void;
  selectedSubject: string;
  userMode: SubjectMode;
  onOpenUpload: () => void;
}) {
  return (
    <aside className="absolute left-[966px] top-0 h-[1200px] w-[954px] rounded-l-[12px] bg-white shadow-[-12px_0_24px_rgba(0,0,0,0.13)]">
      <header className="absolute left-0 top-0 h-[142px] w-full">
        <div className="absolute left-[28px] top-[63px] text-[40px] font-black italic leading-none text-[#242424]">
          AI小乐
        </div>
        <div className="absolute right-[24px] top-[72px] flex items-center gap-[30px]">
          <CirclePlus className="h-[29px] w-[29px] text-[#63c7a2]" />
          <Clock3 className="h-[29px] w-[29px] text-[#222]" />
          <Minus className="h-[31px] w-[31px] stroke-[4] text-[#222]" />
        </div>
      </header>

      <div className="absolute left-[22px] top-[150px]">
        <RobotMark />
      </div>
      <div className="absolute left-[106px] top-[144px] h-[108px] w-[617px] rounded-[8px] bg-[#f7f8fb] px-[22px] py-[22px]">
        <div className="text-[28px] font-bold leading-none text-[#282828]">Hi！我是AI小乐！</div>
        <div className="mt-[15px] text-[23px] leading-none text-[#333]">
          我能够帮您出题、布置作业，请把您的任务交给我吧！
        </div>
      </div>

      <div className="absolute right-[26px] top-[266px] flex h-[46px] rounded-full bg-[#eef0f2] p-[4px]">
        <button
          className={`h-[38px] rounded-full px-[18px] text-[18px] leading-none ${
            userMode === 'single' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#777]'
          }`}
          onClick={() => onUserModeChange('single')}
          type="button"
        >
          单学科用户
        </button>
        <button
          className={`h-[38px] rounded-full px-[18px] text-[18px] leading-none ${
            userMode === 'multiple' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#777]'
          }`}
          onClick={() => onUserModeChange('multiple')}
          type="button"
        >
          多学科用户
        </button>
      </div>

      {isSubjectPickerOpen ? (
        <SubjectSelectionPanel
          onSubjectSelect={onSubjectSelect}
          selectedSubject={selectedSubject}
        />
      ) : (
        <>
          <QuickButton top={334}>帮我布置试卷作业</QuickButton>
          <QuickButton top={412} onClick={onOpenUpload}>
            帮我识别作业资料
          </QuickButton>
          <QuickButton top={485}>帮我布置听力作业</QuickButton>
        </>
      )}

      <div className="absolute bottom-[24px] left-[26px] h-[155px] w-[902px] rounded-[16px] border border-[#d3d3d3] bg-[#f4f4f4] text-[#b9b9b9] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="absolute left-[20px] top-[22px] flex items-center gap-[18px]">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[2px] border-[#222] bg-white opacity-45">
            <Mic2 className="h-[24px] w-[24px] text-[#222]" />
          </div>
          <span className="text-[26px] leading-none text-[#b8b8b8]">向我提问或提出要求</span>
        </div>
        <div className="absolute left-[24px] bottom-[18px] flex h-[44px] items-center rounded-[5px] border border-[#dfdfdf] bg-[#eeeeee] px-[10px] text-[22px] leading-none text-[#6f6f6f] opacity-70">
          <MessageCircle className="mr-[5px] h-[24px] w-[24px]" />
          深度思考（R1）
        </div>
        <button
          className="absolute bottom-[21px] right-[82px] flex h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] border-[#777] bg-[#f1f1f1] text-[#777]"
          disabled
          type="button"
        >
          <Plus className="h-[28px] w-[28px]" />
        </button>
        <button
          className="absolute bottom-[19px] right-[19px] flex h-[45px] w-[45px] items-center justify-center rounded-[8px] bg-[#c9c9c9] text-white"
          disabled
          type="button"
        >
          <SendHorizonal className="h-[28px] w-[28px] fill-white stroke-white" />
        </button>
      </div>
    </aside>
  );
}

const recognitionModes: {
  id: RecognitionMode;
  title: string;
  badge?: string;
  description: string;
}[] = [
  {
    id: 'questions_only',
    title: '仅识别题目',
    description: '适用于只包含题目、不包含答案解析的资料',
  },
  {
    id: 'same_image_answer',
    title: '题目+答案',
    badge: '同图片',
    description: '适用于题目与答案解析紧挨着出现的资料',
  },
  {
    id: 'separate_answer',
    title: '题目+答案',
    badge: '不同图片',
    description: '适用于题目与答案解析分开拍摄的资料',
  },
];

function DiagramLine({
  tone = 'question',
  width = 'w-full',
}: {
  tone?: 'question' | 'answer' | 'muted';
  width?: string;
}) {
  const color =
    tone === 'question'
      ? 'bg-[#a9ead8]'
      : tone === 'answer'
        ? 'bg-[#adc5ff]'
        : 'bg-[#d9dde3]';

  return <div className={`h-[10px] rounded-full ${color} ${width}`} />;
}

function DiagramTag({
  children,
  tone = 'question',
}: {
  children: React.ReactNode;
  tone?: 'question' | 'answer';
}) {
  const toneClass =
    tone === 'question'
      ? 'bg-[#4fc6b1] text-white'
      : 'bg-[#6f94f7] text-white';

  return (
    <div className={`inline-flex h-[30px] items-center rounded-[3px] px-[9px] text-[14px] font-medium leading-none ${toneClass}`}>
      {children}
    </div>
  );
}

function SourcePageFrame({
  title = '资料页',
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)] ${className}`}>
      <div className="absolute left-0 top-0 flex h-[50px] w-full items-center justify-center text-[18px] leading-none text-[#4b5563]">
        {title}
      </div>
      <div className="absolute left-[20px] right-[20px] top-[60px] bottom-[18px]">
        {children}
      </div>
    </div>
  );
}

function ResultPreview({ rich }: { rich: boolean }) {
  if (!rich) {
    return (
      <SourcePageFrame title="识别结果">
        <div className="space-y-[26px] pt-[4px]">
          {[1, 2, 3].map((index) => (
            <div key={index}>
              <div className="mb-[10px] text-[16px] font-medium leading-none text-[#475569]">
                题{index}
              </div>
              <div className="space-y-[9px]">
                <DiagramLine width="w-full" />
                <DiagramLine width="w-[74%]" />
              </div>
            </div>
          ))}
        </div>
      </SourcePageFrame>
    );
  }

  return (
    <SourcePageFrame title="识别结果">
      <div className="space-y-[20px] pt-[2px]">
        <div>
          <div className="mb-[10px] text-[16px] font-medium leading-none text-[#475569]">题1</div>
          <div className="space-y-[9px]">
            <DiagramLine />
            <DiagramLine width="w-[78%]" />
            <DiagramLine width="w-[58%]" />
          </div>
        </div>
        <div>
          <div className="mb-[10px] text-[15px] leading-none text-[#475569]">答案：</div>
          <div className="space-y-[9px]">
            <DiagramLine tone="answer" />
            <DiagramLine tone="answer" width="w-[62%]" />
          </div>
        </div>
        <div>
          <div className="mb-[10px] text-[15px] leading-none text-[#475569]">解析：</div>
          <div className="space-y-[9px]">
            <DiagramLine tone="answer" />
            <DiagramLine tone="answer" width="w-[68%]" />
          </div>
        </div>
      </div>
    </SourcePageFrame>
  );
}

function QuestionBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] h-[58px] w-[218px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[16px] right-[14px] top-[15px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[68%]" />
      </div>
    </div>
  );
}

function AdjacentAnswerBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] h-[66px] w-[258px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[18px] right-[18px] top-[17px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[66%]" />
      </div>
      <div className="absolute left-[18px] top-[78px] space-y-[10px]">
        <DiagramLine tone="answer" width="w-[224px]" />
        <DiagramLine tone="answer" width="w-[172px]" />
      </div>
    </div>
  );
}

function CompactQuestionBlock({
  label,
  top,
  tone = 'question',
}: {
  label: string;
  top: number;
  tone?: 'question' | 'answer';
}) {
  const blockClass =
    tone === 'question'
      ? 'border-[#68d3c2] bg-[#e8faf5]'
      : 'border-[#aec3ff] bg-[#eef3ff]';

  return (
    <div
      className={`absolute left-[12px] h-[52px] w-[108px] rounded-[6px] border ${blockClass}`}
      style={{ top }}
    >
      <div className="absolute -top-[26px] left-0">
        <DiagramTag tone={tone}>
          {label}
        </DiagramTag>
      </div>
      <div className="absolute left-[10px] right-[8px] top-[13px] space-y-[8px]">
        <DiagramLine tone={tone} />
        <DiagramLine tone={tone} width="w-[62%]" />
      </div>
    </div>
  );
}

function CompactFileFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)]">
      <div className="absolute left-0 top-[18px] w-full text-center text-[15px] leading-none text-[#4b5563]">
        {title}
      </div>
      {children}
    </div>
  );
}

function QuestionOnlyDiagram() {
  return (
    <div className="grid h-full grid-cols-[1.34fr_0.76fr] gap-[18px]">
      <SourcePageFrame>
        <QuestionBlock label="题1" top={42} />
        <QuestionBlock label="题2" top={134} />
        <QuestionBlock label="题3" top={226} />
      </SourcePageFrame>
      <ResultPreview rich={false} />
    </div>
  );
}

function SameFileDiagram() {
  return (
    <div className="grid h-full grid-cols-[1.34fr_0.76fr] gap-[18px]">
      <SourcePageFrame>
        <AdjacentAnswerBlock label="题1+答案/解析" top={42} />
        <AdjacentAnswerBlock label="题2+答案/解析" top={190} />
      </SourcePageFrame>
      <ResultPreview rich />
    </div>
  );
}

function SeparateFileDiagram() {
  return (
    <div className="grid h-full grid-cols-[0.9fr_0.9fr_1.08fr] gap-[14px]">
      <CompactFileFrame title="《试卷题目文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock key={index} label={`题${index}`} top={72 + itemIndex * 86} />
        ))}
      </CompactFileFrame>
      <CompactFileFrame title="《试卷答案文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock
            key={index}
            label={`题${index}答案解析`}
            tone="answer"
            top={72 + itemIndex * 86}
          />
        ))}
      </CompactFileFrame>
      <ResultPreview rich />
    </div>
  );
}

function ModeDiagram({ mode }: { mode: RecognitionMode }) {
  if (mode === 'questions_only') {
    return <QuestionOnlyDiagram />;
  }

  if (mode === 'same_image_answer') {
    return <SameFileDiagram />;
  }

  return <SeparateFileDiagram />;
}

function RecognitionModeDialog({
  onClose,
  onModeSelect,
}: {
  onClose: () => void;
  onModeSelect: (mode: RecognitionMode) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 bg-[#f0f4f7]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e8e8e8] bg-white">
        <button
          aria-label="返回"
          className="absolute left-[34px] top-[26px] flex h-[48px] items-center gap-[8px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f4f4f4]"
          onClick={onClose}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[30px] font-normal leading-none">识别作业资料</span>
        </button>
      </header>

      <main className="absolute left-0 top-[96px] h-[1002px] w-full">
        <div className="absolute left-0 top-[50px] w-full text-center">
          <h2 className="text-[34px] font-medium leading-none text-[#1f2933]">
            选择识别方式
          </h2>
          <p className="mt-[18px] text-[22px] leading-none text-[#6b7280]">
            建议根据您的资料内容，选择合适的处理流程
          </p>
        </div>

        <div className="absolute left-[44px] top-[190px] grid w-[1832px] grid-cols-3 gap-[24px]">
          {recognitionModes.map((mode) => {
            const iconColor =
              mode.id === 'questions_only'
                ? 'bg-blue-50 text-blue-600'
                : mode.id === 'same_image_answer'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-amber-50 text-amber-600';
            const badgeColor =
              mode.id === 'same_image_answer'
                ? 'bg-[#eaf5ff] text-[#2698ff]'
                : mode.id === 'separate_answer'
                  ? 'bg-[#fff5dc] text-[#f59f22]'
                  : 'bg-blue-50 text-blue-600';
            const Icon =
              mode.id === 'questions_only'
                ? FileText
                : mode.id === 'same_image_answer'
                  ? Images
                  : LayersIcon;

            return (
              <button
                key={mode.id}
                className="group flex h-[600px] cursor-pointer flex-col rounded-[16px] border-2 border-white bg-white px-[34px] pb-[32px] pt-[36px] text-left shadow-[0_12px_34px_rgba(31,44,58,0.10)] transition-all active:scale-[0.995] active:border-[#58cf9a] active:bg-[#f3fbf7]"
                onClick={() => onModeSelect(mode.id)}
                type="button"
              >
                <div className="mb-[30px] flex items-start gap-[18px]">
                  <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] ${iconColor}`}>
                    <Icon className="h-[28px] w-[28px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[30px] font-bold leading-none text-[#222831]">
                        {mode.title}
                      </span>
                      {mode.badge ? (
                        <span className={`rounded-full px-[12px] py-[6px] text-[18px] font-medium leading-none ${badgeColor}`}>
                          {mode.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-[22px] text-[22px] leading-none text-[#7b818a]">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 rounded-[8px] border border-[#edf0f2] bg-[#fbfcfd] p-[18px]">
                  <ModeDiagram mode={mode.id} />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function SourceCard({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-[286px] w-[428px] flex-col items-center justify-center rounded-[16px] bg-[#f8f9f9] text-center shadow-[0_8px_24px_rgba(20,44,35,0.06)] active:scale-[0.99] active:bg-[#f2f7f5]"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[20px] bg-white text-[#49bf89] shadow-[0_6px_18px_rgba(20,44,35,0.08)]">
        {icon}
      </div>
      <div className="mt-[30px] text-[30px] font-medium leading-none text-[#202124]">
        {title}
      </div>
    </button>
  );
}

function createMockCapture(role: ImageRole | undefined, index: number): SelectedImage {
  const roleText = role === 'question' ? '题目图片' : role === 'answer' ? '答案图片' : '作业图片';
  const accent = role === 'answer' ? '#6f94f7' : '#58cf9a';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <rect width="320" height="220" rx="18" fill="#f7fafc"/>
      <rect x="28" y="24" width="264" height="172" rx="12" fill="#ffffff" stroke="#d9e1e8" stroke-width="2"/>
      <rect x="54" y="58" width="118" height="20" rx="10" fill="${accent}"/>
      <rect x="54" y="96" width="210" height="12" rx="6" fill="#bae9da"/>
      <rect x="54" y="122" width="170" height="12" rx="6" fill="#c7d7ff"/>
      <rect x="54" y="148" width="198" height="12" rx="6" fill="#c7d7ff"/>
      <text x="66" y="73" fill="#ffffff" font-size="16" font-family="Arial, sans-serif">${roleText}${index}</text>
    </svg>
  `;

  return {
    name: `${roleText}${index}.jpg`,
    role,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

function revokeImageUrls(images: SelectedImage[]) {
  images.forEach((image) => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
}

function revokeImageUrl(image: SelectedImage) {
  if (image.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url);
  }
}

function appendFilesAsImages(files: File[], role?: ImageRole): SelectedImage[] {
  const rolePrefix = role === 'question' ? '题目' : role === 'answer' ? '答案' : '';

  return files.map((file, index) => ({
    name: rolePrefix ? `${rolePrefix}_${file.name || index + 1}` : file.name,
    role,
    url: URL.createObjectURL(file),
  }));
}

function getStepThreeModeLabel(mode: RecognitionMode | '') {
  if (mode === 'questions_only') return '仅识别题目';
  if (mode === 'same_image_answer') return '题目+答案 · 同图片';
  if (mode === 'separate_answer') return '题目+答案 · 不同图片';
  return '识别作业资料';
}

function getStepThreeModeTip(mode: RecognitionMode | '') {
  if (mode === 'questions_only') return '只框选题目内容，答案解析不参与处理';
  if (mode === 'same_image_answer') return '只框选题目内容，答案解析后续自动匹配';
  if (mode === 'separate_answer') return '只对题目图片切题，答案图片后续参与答案解析匹配';
  return '请在左侧资料上选择需要识别的内容';
}

function clampPercent(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMaterialPageFrameSize(page: MaterialPage) {
  const scale = Math.min(
    MATERIAL_PAGE_MAX_WIDTH / page.naturalWidth,
    MATERIAL_PAGE_MAX_HEIGHT / page.naturalHeight,
  );

  return {
    width: page.naturalWidth * scale,
    height: page.naturalHeight * scale,
  };
}

function expandSystemBoxForSelectIcon(box: RecognitionBox, page: MaterialPage | undefined) {
  if (!page || box.source !== 'system') return box;

  const frame = getMaterialPageFrameSize(page);
  const offsetPercent = (OCR_BOX_SELECT_ICON_SAFE_WIDTH / frame.width) * 100;
  const actualOffset = Math.min(offsetPercent, box.x);
  const rightEdge = clampPercent(box.x + box.width, 0, 100);
  const nextX = box.x - actualOffset;

  return {
    ...box,
    x: nextX,
    width: clampPercent(rightEdge - nextX, 3, 100 - nextX),
  };
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => reject(new Error('image load failed'));
    image.src = url;
  });
}

async function prepareMaterialPages(images: SelectedImage[]) {
  const pages: MaterialPage[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const [{ width, height }, blob] = await Promise.all([
      loadImageSize(image.url),
      fetch(image.url).then((response) => response.blob()),
    ]);
    const imageData = await readBlobAsDataUrl(blob);

    pages.push({
      ...image,
      pageNumber: index + 1,
      naturalWidth: width,
      naturalHeight: height,
      imageData,
    });
  }

  return pages;
}

async function detectMaterialBoxes(pages: MaterialPage[]) {
  const response = await fetch('/api/auto-detect-boxes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pages: pages.map((page) => ({
        pageNumber: page.pageNumber,
        imageData: page.imageData,
        width: page.naturalWidth,
        height: page.naturalHeight,
      })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'auto detect failed');
  }

  if (!response.body) {
    throw new Error('auto detect response is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventText of events) {
      const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
        type?: string;
        data?: {
          error?: string;
          result?: {
            boxes?: Array<{
              pageNumber?: number;
              x?: number;
              y?: number;
              width?: number;
              height?: number;
            }>;
          };
        };
      };

      if (event.type === 'error') {
        throw new Error(event.data?.error || 'auto detect failed');
      }

      if (event.type === 'complete') {
        return (event.data?.result?.boxes || []).map((box, index) => ({
          id: `system-${box.pageNumber || 1}-${index}-${Date.now()}`,
          pageNumber: box.pageNumber || 1,
          x: clampPercent(Number(box.x || 0), 0, 96),
          y: clampPercent(Number(box.y || 0), 0, 96),
          width: clampPercent(Number(box.width || 0), 4, 100),
          height: clampPercent(Number(box.height || 0), 3, 100),
          selected: true,
          source: 'system' as const,
        }));
      }
    }

    if (done) break;
  }

  return [];
}

function cropImageByPixels(
  imageData: string,
  region: { x: number; y: number; width: number; height: number },
) {
  return new Promise<{ imageData: string; width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sourceX = clampPercent(region.x, 0, image.naturalWidth - 1);
      const sourceY = clampPercent(region.y, 0, image.naturalHeight - 1);
      const sourceWidth = clampPercent(region.width, 1, image.naturalWidth - sourceX);
      const sourceHeight = clampPercent(region.height, 1, image.naturalHeight - sourceY);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      resolve({
        imageData: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    };
    image.onerror = () => reject(new Error('图片裁剪失败'));
    image.src = imageData;
  });
}

function cropMaterialQuestionImage(page: MaterialPage, crop: ReviewQuestion['crop']) {
  return cropImageByPixels(page.imageData, {
    x: Math.round((crop.x / 100) * page.naturalWidth),
    y: Math.round((crop.y / 100) * page.naturalHeight),
    width: Math.round((crop.width / 100) * page.naturalWidth),
    height: Math.round((crop.height / 100) * page.naturalHeight),
  });
}

function cropRenderedImageRegion(
  imageData: string,
  displaySize: { width: number; height: number },
  region: CropRegion,
) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scaleX = image.naturalWidth / displaySize.width;
      const scaleY = image.naturalHeight / displaySize.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(region.width * scaleX);
      canvas.height = Math.round(region.height * scaleY);
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      context.drawImage(
        image,
        region.x * scaleX,
        region.y * scaleY,
        region.width * scaleX,
        region.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('图片裁剪失败'));
    image.src = imageData;
  });
}

function CameraGrid() {
  return (
    <>
      {[1, 2, 3, 4].map((index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 h-full w-px bg-white/55"
          style={{ left: `${index * 20}%` }}
        />
      ))}
      {[1, 2, 3].map((index) => (
        <div
          key={`h-${index}`}
          className="absolute left-0 h-px w-full bg-white/55"
          style={{ top: `${index * 25}%` }}
        />
      ))}
    </>
  );
}

function CaptureImageManager({
  answerImages,
  mode,
  onClose,
  onDelete,
  onMove,
  questionImages,
  selectedImages,
}: {
  answerImages: SelectedImage[];
  mode: RecognitionMode | '';
  onClose: () => void;
  onDelete: (image: SelectedImage, role?: ImageRole) => void;
  onMove: (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => void;
  questionImages: SelectedImage[];
  selectedImages: SelectedImage[];
}) {
  const isSeparateMode = mode === 'separate_answer';
  const renderImageItem = (image: SelectedImage, role?: ImageRole) => (
    <div
      key={image.url}
      className="flex h-[116px] items-center gap-[16px] rounded-[12px] border border-[#e6e9ed] bg-white p-[12px]"
    >
      <img
        alt=""
        className="h-[88px] w-[88px] rounded-[8px] object-cover"
        src={image.url}
      />
      <div className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center gap-[10px]">
        {isSeparateMode && role ? (
          <button
            className="h-[42px] rounded-[7px] border border-[#d7dde3] bg-white px-[14px] text-[18px] leading-none text-[#4b5563] active:bg-[#f4f6f7]"
            onClick={() => onMove(image, role, role === 'question' ? 'answer' : 'question')}
            type="button"
          >
            移到{role === 'question' ? '答案' : '题目'}
          </button>
        ) : null}
        <button
          className="h-[42px] rounded-[7px] bg-[#fff1f1] px-[14px] text-[18px] leading-none text-[#e14c4c] active:bg-[#ffe5e5]"
          onClick={() => onDelete(image, role)}
          type="button"
        >
          删除
        </button>
      </div>
    </div>
  );
  const renderGroup = (title: string, images: SelectedImage[], role?: ImageRole) => (
    <section>
      <div className="mb-[14px] flex items-center justify-between">
        <h3 className="text-[24px] font-semibold leading-none text-[#202124]">{title}</h3>
        <span className="text-[19px] leading-none text-[#7a838d]">{images.length} 张</span>
      </div>
      <div className="grid gap-[12px]">
        {images.length > 0 ? (
          images.map((image) => renderImageItem(image, role))
        ) : (
          <div className="flex h-[104px] items-center justify-center rounded-[12px] border border-dashed border-[#d7dde3] bg-[#f7f8f9] text-[21px] text-[#8b949e]">
            暂未添加图片
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="absolute inset-0 z-40 bg-black/45">
      <div className="absolute right-[156px] top-[118px] h-[930px] w-[720px] rounded-[18px] bg-[#f8fafb] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7ea] bg-white">
          <div className="absolute left-[34px] top-[30px] text-[28px] font-semibold leading-none text-[#202124]">
            已拍图片
          </div>
          <button
            aria-label="关闭图片管理"
            className="absolute right-[24px] top-[20px] flex h-[48px] w-[48px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f2f4f5]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[32px] w-[32px]" />
          </button>
        </header>
        <div className="absolute bottom-0 left-0 right-0 top-[88px] overflow-y-auto p-[28px]">
          <div className="space-y-[30px]">
            {isSeparateMode ? (
              <>
                {renderGroup('题目', questionImages, 'question')}
                {renderGroup('答案', answerImages, 'answer')}
              </>
            ) : (
              renderGroup('作业图片', selectedImages)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CaptureSimulator({
  title,
  currentRole,
  currentImages,
  mode,
  questionCount,
  answerCount,
  questionImages,
  answerImages,
  selectedImages,
  primaryText,
  primaryDisabled,
  onAlbumSelected,
  onCapture,
  onClose,
  onDeleteImage,
  onMoveImage,
  onPrimary,
  onRoleChange,
}: {
  title: string;
  currentRole?: ImageRole;
  currentImages: SelectedImage[];
  mode: RecognitionMode | '';
  questionCount: number;
  answerCount: number;
  questionImages: SelectedImage[];
  answerImages: SelectedImage[];
  selectedImages: SelectedImage[];
  primaryText: string;
  primaryDisabled: boolean;
  onAlbumSelected: (files: File[]) => void;
  onCapture: () => void;
  onClose: () => void;
  onDeleteImage: (image: SelectedImage, role?: ImageRole) => void;
  onMoveImage: (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => void;
  onPrimary: () => void;
  onRoleChange?: (role: ImageRole) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const latestImage = currentImages[currentImages.length - 1];
  const managerImageCount = mode === 'separate_answer'
    ? questionImages.length + answerImages.length
    : selectedImages.length;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#101010]">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />

      <div className="absolute left-0 top-0 h-full w-[1784px] overflow-hidden bg-[#d8e0df]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#d8e2e1_0%,#f6f7f4_34%,#cbd2ce_64%,#4c302d_100%)]" />
        <div className="absolute left-[-120px] top-[730px] h-[580px] w-[980px] rotate-[-12deg] rounded-[120px] bg-[#5b2d2d]/55 blur-[4px]" />
        <div className="absolute left-[710px] top-[-70px] h-[260px] w-[360px] rotate-[16deg] rounded-[22px] bg-[#267fcc]/45 blur-[1px]" />
        <CameraGrid />
        <div className="absolute left-[360px] top-[210px] h-[690px] w-[930px] rotate-[-12deg] rounded-[6px] border-[4px] border-[#55d99d] bg-white/8" />
        <div className="absolute left-1/2 top-[536px] -translate-x-1/2 rounded-[12px] bg-black/40 px-[34px] py-[17px] text-[28px] font-medium leading-none text-white/90">
          {currentRole
            ? `拍摄${currentRole === 'question' ? '题目' : '答案'}`
            : title}
        </div>

        <button
          aria-label="关闭"
          className="absolute left-[31px] top-[45px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-black/70 text-white active:bg-black"
          onClick={onClose}
          type="button"
        >
          <X className="h-[33px] w-[33px]" />
        </button>

        {currentRole ? (
          <div className="absolute left-1/2 top-[42px] flex -translate-x-1/2 gap-[12px] rounded-full bg-black/35 p-[7px]">
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'question' ? 'bg-[#58cf9a] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('question')}
              type="button"
            >
              题目图片 {questionCount}
            </button>
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'answer' ? 'bg-[#6f94f7] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('answer')}
              type="button"
            >
              答案图片 {answerCount}
            </button>
          </div>
        ) : null}

        <button
          className="absolute right-[156px] top-[50px] rounded-full bg-black/55 px-[28px] py-[16px] text-[25px] font-medium leading-none text-white"
          type="button"
        >
          拍摄示例
        </button>
      </div>

      <aside className="absolute right-0 top-0 h-full w-[136px] bg-[#1f1f1f]">
        <button
          aria-label="从相册选择"
          className="absolute left-[30px] top-[232px] flex h-[76px] w-[76px] items-center justify-center rounded-full bg-black text-white active:bg-[#303030]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Images className="h-[38px] w-[38px]" />
        </button>

        <button
          aria-label="拍照"
          className="absolute left-[23px] top-[538px] h-[90px] w-[90px] rounded-full border-[8px] border-white/45 bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.75)] active:scale-95"
          onClick={onCapture}
          type="button"
        />

        <div className="absolute bottom-[38px] left-[18px] h-[86px] w-[102px]">
          <button
            aria-label="管理已拍图片"
            className="relative block h-[74px] w-[74px] rounded-[9px] active:scale-95 disabled:active:scale-100"
            disabled={managerImageCount === 0}
            onClick={() => setIsManagerOpen(true)}
            type="button"
          >
            {latestImage ? (
              <img
                alt=""
                className="h-full w-full rounded-[9px] border border-white/70 object-cover"
                src={latestImage.url}
              />
            ) : (
              <div className="h-full w-full rounded-[9px] border border-white/35 bg-black/40" />
            )}
          </button>
          {currentImages.length > 0 ? (
            <span className="absolute right-[15px] top-[-10px] flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#58cf9a] px-[8px] text-[17px] font-medium leading-none text-white">
              {currentImages.length}
            </span>
          ) : null}
          <button
            className={`absolute bottom-[-6px] right-0 h-[38px] rounded-full px-[14px] text-[18px] font-medium leading-none text-white ${
              primaryDisabled ? 'bg-[#7a7a7a]' : 'bg-[#58cf9a] active:bg-[#45bf89]'
            }`}
            disabled={primaryDisabled}
            onClick={onPrimary}
            type="button"
          >
            {primaryText}
          </button>
        </div>
      </aside>
      {isManagerOpen ? (
        <CaptureImageManager
          answerImages={answerImages}
          mode={mode}
          onClose={() => setIsManagerOpen(false)}
          onDelete={onDeleteImage}
          onMove={onMoveImage}
          questionImages={questionImages}
          selectedImages={selectedImages}
        />
      ) : null}
    </div>
  );
}

function OcrPreviewPage({
  images,
  mode,
  onBack,
  subject,
}: {
  images: SelectedImage[];
  mode: RecognitionMode | '';
  onBack: () => void;
  subject: string;
}) {
  const modeLabel =
    mode === 'questions_only'
      ? '仅识别题目'
      : mode === 'same_image_answer'
        ? '题目+答案｜同图片'
        : '题目+答案｜不同图片';
  const questionCount = images.filter((image) => image.role === 'question').length;
  const answerCount = images.filter((image) => image.role === 'answer').length;

  return (
    <div className="absolute inset-0 z-30 bg-[#f5f7f8]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e6e9ec] bg-white">
        <button
          aria-label="返回拍摄"
          className="absolute left-[34px] top-[26px] flex h-[48px] items-center gap-[8px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f4f4f4]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[30px] font-normal leading-none">识别作业资料</span>
        </button>
        <div className="absolute right-[48px] top-[30px] rounded-full bg-[#eaf7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#31ad76]">
          {subject}
        </div>
      </header>

      <main className="absolute left-0 top-[96px] flex h-[1104px] w-full">
        <section className="relative h-full w-[770px] border-r border-[#e1e5e8] bg-white">
          <div className="absolute left-[42px] top-[34px]">
            <div className="text-[30px] font-semibold leading-none text-[#202124]">待切题资料</div>
            <div className="mt-[14px] text-[21px] leading-none text-[#737b84]">
              {modeLabel} · 共 {images.length} 张图片
              {mode === 'separate_answer' ? ` · 题目 ${questionCount} 张 / 答案 ${answerCount} 张` : ''}
            </div>
          </div>

          <div className="absolute left-[42px] top-[124px] grid w-[686px] grid-cols-2 gap-[18px]">
            {images.slice(0, 6).map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative h-[168px] rounded-[12px] border border-[#e6eaee] bg-[#f8fafb] p-[12px]"
              >
                <img
                  alt=""
                  className="h-full w-full rounded-[8px] object-cover"
                  src={image.url}
                />
                <span className={`absolute left-[18px] top-[18px] rounded-[4px] px-[8px] py-[5px] text-[16px] font-medium leading-none text-white ${
                  image.role === 'answer' ? 'bg-[#6f94f7]' : 'bg-[#10b981]'
                }`}>
                  {image.role === 'answer' ? '答案' : '题目'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex-1 bg-[#f5f7f8]">
          <div className="absolute left-[68px] top-[54px] text-[32px] font-semibold leading-none text-[#202124]">
            OCR 切题中
          </div>
          <div className="absolute left-[68px] top-[110px] text-[22px] leading-none text-[#7b838c]">
            已带入学科和识别方式，拍摄完成后直接进入切题环节
          </div>

          <div className="absolute left-[68px] top-[178px] h-[720px] w-[934px] rounded-[16px] border border-[#e2e7eb] bg-white shadow-[0_10px_32px_rgba(31,44,58,0.08)]">
            <div className="absolute left-[42px] top-[40px] h-[610px] w-[510px] rounded-[10px] border border-[#dde4ea] bg-[#fbfbfa] p-[26px]">
              <div className="mb-[24px] h-[20px] w-[270px] rounded-full bg-[#dce3e8]" />
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="relative mb-[48px] h-[116px] rounded-[8px] border-2 border-[#58cf9a] bg-[#e8faf5]"
                >
                  <span className="absolute -left-[2px] -top-[32px] rounded bg-[#4fc6b1] px-[10px] py-[7px] text-[18px] font-medium leading-none text-white">
                    题{index + 1}
                  </span>
                  <div className="absolute left-[24px] right-[24px] top-[28px] space-y-[14px]">
                    <div className="h-[14px] rounded-full bg-[#a9ead8]" />
                    <div className="h-[14px] w-[72%] rounded-full bg-[#a9ead8]" />
                    <div className="h-[14px] w-[52%] rounded-full bg-[#d6dde3]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute right-[42px] top-[62px] h-[560px] w-[280px] rounded-[12px] bg-[#f7faf9] p-[24px]">
              <div className="text-[24px] font-semibold leading-none text-[#202124]">识别进度</div>
              <div className="mt-[34px] space-y-[22px]">
                {['智能切题', '识别题干', mode === 'questions_only' ? '整理题目' : '匹配答案解析'].map((step, index) => (
                  <div key={step} className="flex items-center gap-[14px]">
                    <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#58cf9a] text-[16px] font-semibold leading-none text-white">
                      {index + 1}
                    </span>
                    <span className="text-[21px] leading-none text-[#3d4650]">{step}</span>
                  </div>
                ))}
              </div>
              <button
                className="absolute bottom-[28px] left-[24px] h-[56px] w-[232px] rounded-[8px] bg-[#58cf9a] text-[23px] font-medium leading-none text-white active:bg-[#45bf89]"
                type="button"
              >
                查看切题结果
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StepThreeGuide({ mode }: { mode: RecognitionMode | '' }) {
  const isSameImage = mode === 'same_image_answer';
  const isSeparate = mode === 'separate_answer';

  return (
    <div className="relative h-[420px] w-[660px] rounded-[18px] border border-dashed border-[#d8dee5] bg-white shadow-[0_16px_42px_rgba(31,44,58,0.08)]">
      <div className="absolute left-[48px] top-[42px] flex h-[304px] w-[276px] flex-col gap-[18px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[22px]">
        <div className="text-center text-[22px] font-medium text-[#5b6672]">资料页</div>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={`relative h-[74px] rounded-[7px] border ${
              item === 1 && !isSeparate ? 'border-[#39c8b8] bg-[#e4f8f4]' : 'border-[#edf0f3] bg-[#f4f5f6]'
            }`}
          >
            <span className="absolute -left-px -top-[24px] rounded bg-[#4fc6b1] px-[9px] py-[5px] text-[16px] leading-none text-white">
              题{item}
            </span>
            {isSameImage ? (
              <div className="absolute left-[20px] right-[20px] bottom-[12px] h-[10px] rounded-full bg-[#b8cdfb]" />
            ) : null}
            {isSeparate ? (
              <div className="absolute inset-x-[20px] top-[26px] h-[10px] rounded-full bg-[#9fe8d5]" />
            ) : (
              <div className="absolute inset-x-[20px] top-[22px] h-[10px] rounded-full bg-[#9fe8d5]" />
            )}
          </div>
        ))}
      </div>

      {isSeparate ? (
        <div className="absolute left-[344px] top-[42px] flex h-[304px] w-[138px] flex-col gap-[18px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[22px]">
          <div className="text-center text-[21px] font-medium text-[#5b6672]">答案页</div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[74px] rounded-[7px] border border-[#c8d8ff] bg-[#eef4ff]">
              <span className="ml-[12px] mt-[10px] inline-block rounded bg-[#6f94f7] px-[8px] py-[5px] text-[15px] leading-none text-white">
                题{item}答案
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="absolute right-[42px] top-[42px] h-[304px] w-[148px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[20px]">
        <div className="text-center text-[21px] font-medium text-[#202124]">识别结果</div>
        <div className="mt-[34px] space-y-[18px]">
          <div className="h-[10px] rounded-full bg-[#9fe8d5]" />
          <div className="h-[10px] w-[72%] rounded-full bg-[#9fe8d5]" />
          {mode !== 'questions_only' ? (
            <>
              <div className="mt-[28px] h-[10px] rounded-full bg-[#b8cdfb]" />
              <div className="h-[10px] w-[62%] rounded-full bg-[#b8cdfb]" />
            </>
          ) : null}
        </div>
      </div>
      <div className="absolute bottom-[28px] left-1/2 w-[560px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#23bfb2] px-[28px] py-[12px] text-center text-[20px] font-medium leading-none text-white">
        左侧框选题目并选中后，点击「开始识别」
      </div>
    </div>
  );
}

function TabletConfirmDialog({
  action,
  onCancel,
  onConfirm,
}: {
  action: TabletConfirmAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;

  const isClear = action === 'clear';

  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 h-[302px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className={`absolute left-[40px] right-[40px] ${isClear ? 'top-1/2 -translate-y-1/2' : 'top-[42px]'}`}>
          <h3 className={`text-[28px] font-semibold leading-none text-[#202124] ${isClear ? 'text-center' : ''}`}>
            {isClear ? '确认清空所有切题框？' : '确认更换资料吗？'}
          </h3>
          {!isClear ? (
            <p className="mt-[24px] text-[21px] leading-[32px] text-[#68727d]">
              更换资料，将清空当前已识别的内容，并且需要重新选择识别方式。
            </p>
          ) : null}
        </div>
        <div className="absolute bottom-[30px] right-[32px] flex gap-[16px]">
          <button
            className="h-[48px] rounded-[8px] border border-[#d7dde3] bg-white px-[28px] text-[21px] leading-none text-[#3f4852] active:bg-[#f4f6f7]"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button
            className="h-[48px] rounded-[8px] bg-[#e45454] px-[28px] text-[21px] font-medium leading-none text-white active:bg-[#d84242]"
            onClick={onConfirm}
            type="button"
          >
            {isClear ? '确认清空' : '确认'}
          </button>
        </div>
      </section>
    </div>
  );
}

function AddBoxModeTipDialog({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white px-[44px] py-[38px] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <button
          aria-label="关闭识别框添加提示"
          className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f3f5f6] active:text-[#202124]"
          onClick={onConfirm}
          type="button"
        >
          <X className="h-[22px] w-[22px] stroke-[2.4]" />
        </button>
        <h3 className="text-[28px] font-semibold leading-none text-[#202124]">
          识别框添加提示
        </h3>
        <p className="mt-[24px] text-[21px] leading-[34px] text-[#3f4852]">
          启用后，您可在需框选的题目位置单击屏幕，即可增加识别框（无需使用时，再次点击按钮，即可关闭该功能）。
        </p>
        <div className="mt-[34px] flex justify-end">
          <button
            className="h-[48px] rounded-[8px] bg-[#23bfb2] px-[30px] text-[21px] font-medium leading-none text-white active:bg-[#12a99d]"
            onClick={onConfirm}
            type="button"
          >
            我知道了
          </button>
        </div>
      </section>
    </div>
  );
}

function getReviewQuestionTypeLabel(type: ReviewQuestionType) {
  return reviewQuestionTypeOptions.find((option) => option.value === type)?.label || '问答题';
}

function createInitialReviewQuestions(boxes: RecognitionBox[], displayMode: ReviewDisplayMode): ReviewQuestion[] {
  return boxes
    .filter((box) => box.selected)
    .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y)
    .map((box) => ({
      id: box.id,
      pageNumber: box.pageNumber,
      crop: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      questionType: 'short_answer',
      questionTypeStatus: 'pending',
      optionCount: 4,
      blankCount: 1,
      subQuestions: [],
      viewMode: displayMode,
    }));
}

function applyAiQuestionType(question: ReviewQuestion, matchedQuestion: ReviewAiMatchedQuestion | undefined): ReviewQuestion {
  if (!matchedQuestion) {
    return {
      ...question,
      questionTypeStatus: 'failed',
    };
  }

  const questionType = mapRecognizedQuestionType(matchedQuestion.questionType);
  return {
    ...question,
    blankCount: getDefaultBlankCount(questionType, matchedQuestion.blankCount),
    optionCount: getDefaultOptionCount(questionType, matchedQuestion.optionCount),
    questionType,
    questionTypeStatus: 'recognized',
    subQuestions: questionType === 'material'
      ? (matchedQuestion.subQuestions && matchedQuestion.subQuestions.length > 0
          ? matchedQuestion.subQuestions.map((subQuestion, index) => {
              const subQuestionType = mapRecognizedQuestionType(subQuestion.questionType);
              return {
                id: `${question.id}-ai-sub-${index + 1}-${Date.now()}`,
                blankCount: getDefaultBlankCount(subQuestionType, subQuestion.blankCount),
                optionCount: getDefaultOptionCount(subQuestionType, subQuestion.optionCount),
                questionType: subQuestionType,
              };
            })
          : question.subQuestions)
      : [],
  };
}

function StepSegmentedControl({
  labels = {
    recognition: '识别',
    image: '图片',
  },
  mode,
  onChange,
}: {
  labels?: {
    recognition: string;
    image: string;
  };
  mode: ReviewDisplayMode;
  onChange: (mode: ReviewDisplayMode) => void;
}) {
  return (
    <div className="flex h-[42px] rounded-[8px] bg-[#eef1f3] p-[4px]">
      <button
        className={`h-[34px] rounded-[6px] px-[15px] text-[18px] font-medium leading-none ${
          mode === 'recognition' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
        }`}
        onClick={() => onChange('recognition')}
        type="button"
      >
        {labels.recognition}
      </button>
      <button
        className={`h-[34px] rounded-[6px] px-[15px] text-[18px] font-medium leading-none ${
          mode === 'image' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
        }`}
        onClick={() => onChange('image')}
        type="button"
      >
        {labels.image}
      </button>
    </div>
  );
}

function QuestionTypeSelect({
  status = 'recognized',
  value,
  onChange,
}: {
  status?: QuestionTypeRecognitionStatus;
  value: ReviewQuestionType;
  onChange: (value: ReviewQuestionType) => void;
}) {
  const statusLabel = status === 'pending'
    ? '识别中'
    : status === 'stale'
      ? '待重新识别'
      : status === 'failed'
        ? '识别失败'
        : '';

  return (
    <label className={`relative inline-flex h-[42px] min-w-[128px] items-center rounded-[7px] border bg-white pl-[14px] pr-[38px] text-[20px] font-medium leading-none ${
      statusLabel ? 'border-[#d7dde3] text-[#7b858f]' : 'border-[#26c9bc] text-[#16a69a]'
    }`}>
      <select
        aria-label="题型"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => onChange(event.target.value as ReviewQuestionType)}
        value={value}
      >
        {reviewQuestionTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span>{statusLabel || getReviewQuestionTypeLabel(value)}</span>
      <ChevronDown className="absolute right-[10px] top-1/2 h-[22px] w-[22px] -translate-y-1/2" />
    </label>
  );
}

function CountStepper({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="inline-flex h-[40px] items-center overflow-hidden rounded-[7px] border border-[#d7dde3] bg-white">
      <span className="px-[12px] text-[18px] leading-none text-[#68727d]">{label}</span>
      <button
        className="flex h-full w-[38px] items-center justify-center border-l border-[#d7dde3] text-[#69727c] active:bg-[#f3f5f6] disabled:text-[#c4cbd2]"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        type="button"
      >
        <Minus className="h-[18px] w-[18px]" />
      </button>
      <span className="flex h-full min-w-[44px] items-center justify-center border-l border-[#d7dde3] text-[20px] leading-none text-[#202124]">
        {value}
      </span>
      <button
        className="flex h-full w-[38px] items-center justify-center border-l border-[#d7dde3] text-[#69727c] active:bg-[#f3f5f6]"
        onClick={() => onChange(Math.min(12, value + 1))}
        type="button"
      >
        <Plus className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function CroppedQuestionImage({
  cropRegion,
  imageData,
  isEditing,
  onClick,
  onCropDragStart,
  onImageLoad,
}: {
  cropRegion: CropRegion | null;
  imageData: string | undefined;
  isEditing: boolean;
  onClick: () => void;
  onCropDragStart: (event: ReactPointerEvent, action: CropDragAction) => void;
  onImageLoad: (width: number, height: number) => void;
}) {
  if (!imageData) {
    return (
      <div
        className="flex h-[204px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#d7dde3] bg-[#f8fafb] text-[20px] text-[#8b949e]"
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onClick();
        }}
        role="button"
        tabIndex={0}
      >
        暂无题目图片
      </div>
    );
  }

  const cropHandleClass = 'absolute h-[14px] w-[14px] rounded-full border-[2px] border-[#2f80ed] bg-white shadow-[0_1px_5px_rgba(47,128,237,0.32)]';

  return (
    <div
      className="relative flex w-full justify-center rounded-[8px] border border-[#dfe4e8] bg-white px-[18px] py-[16px]"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative max-w-full overflow-visible bg-white">
        <img
          alt=""
          className="block h-auto max-w-full"
          draggable={false}
          onLoad={(event) => {
            onImageLoad(event.currentTarget.clientWidth, event.currentTarget.clientHeight);
          }}
          src={imageData}
          style={{ width: REVIEW_QUESTION_IMAGE_MAX_WIDTH }}
        />
        {isEditing && cropRegion ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/28" />
            <div
              className="absolute cursor-move border-[2px] border-white shadow-[0_0_0_1px_rgba(47,128,237,0.9),0_8px_24px_rgba(0,0,0,0.16)]"
              onPointerDown={(event) => onCropDragStart(event, 'move')}
              style={{
                height: cropRegion.height,
                left: cropRegion.x,
                top: cropRegion.y,
                width: cropRegion.width,
              }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-1/3 top-0 w-px bg-white/36" />
                <div className="absolute bottom-0 left-2/3 top-0 w-px bg-white/36" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/36" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/36" />
              </div>
              <div className={`${cropHandleClass} -left-[7px] -top-[7px] cursor-nw-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-nw')} />
              <div className={`${cropHandleClass} -right-[7px] -top-[7px] cursor-ne-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-ne')} />
              <div className={`${cropHandleClass} -bottom-[7px] -left-[7px] cursor-sw-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-sw')} />
              <div className={`${cropHandleClass} -bottom-[7px] -right-[7px] cursor-se-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-se')} />
              <div className="absolute -top-[5px] left-1/2 h-[10px] w-[28px] -translate-x-1/2 cursor-n-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-n')} />
              <div className="absolute -bottom-[5px] left-1/2 h-[10px] w-[28px] -translate-x-1/2 cursor-s-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-s')} />
              <div className="absolute -left-[5px] top-1/2 h-[28px] w-[10px] -translate-y-1/2 cursor-w-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-w')} />
              <div className="absolute -right-[5px] top-1/2 h-[28px] w-[10px] -translate-y-1/2 cursor-e-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-e')} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AnswerConfigPanel({
  onAddSubQuestion,
  onBlankCountChange,
  onDeleteSubQuestion,
  onOptionCountChange,
  onSubQuestionBlankCountChange,
  onSubQuestionOptionCountChange,
  onSubQuestionTypeChange,
  question,
}: {
  onAddSubQuestion: (questionType: ReviewQuestionType) => void;
  onBlankCountChange: (value: number) => void;
  onDeleteSubQuestion: (subQuestionId: string) => void;
  onOptionCountChange: (value: number) => void;
  onSubQuestionBlankCountChange: (subQuestionId: string, value: number) => void;
  onSubQuestionOptionCountChange: (subQuestionId: string, value: number) => void;
  onSubQuestionTypeChange: (subQuestionId: string, value: ReviewQuestionType) => void;
  question: ReviewQuestion;
}) {
  const [isAddTypeMenuOpen, setIsAddTypeMenuOpen] = useState(false);

  if (question.questionType === 'single_choice' || question.questionType === 'multiple_choice') {
    return <CountStepper label="选项数" onChange={onOptionCountChange} value={question.optionCount} />;
  }

  if (question.questionType === 'fill_blank') {
    return <CountStepper label="空数" onChange={onBlankCountChange} value={question.blankCount} />;
  }

  if (question.questionType === 'material') {
    return (
      <div>
        <div className="mb-[22px] flex items-center gap-[20px]">
          <div className="relative">
            <button
              className="inline-flex h-[52px] items-center gap-[10px] rounded-[7px] border border-[#c9ced3] bg-white px-[20px] text-[24px] leading-none text-[#4d5258] active:bg-[#f4f6f7]"
              onClick={() => setIsAddTypeMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <Plus className="h-[28px] w-[28px] stroke-[2.4]" />
              子题
            </button>
            {isAddTypeMenuOpen ? (
              <div className="absolute left-0 top-[60px] z-30 w-[188px] overflow-hidden rounded-[9px] border border-[#dfe4e8] bg-white shadow-[0_14px_32px_rgba(31,44,58,0.18)]">
                {reviewQuestionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className="h-[46px] w-full px-[18px] text-left text-[20px] leading-none text-[#4d5258] active:bg-[#f3f5f6]"
                    onClick={() => {
                      onAddSubQuestion(option.value);
                      setIsAddTypeMenuOpen(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#b7bbc0] text-[22px] font-semibold leading-none text-white">
            !
          </span>
          <span className="text-[22px] leading-none text-[#8b8f95]">请核对子题题型</span>
        </div>
        <div className="grid justify-start gap-[16px]">
          {question.subQuestions.map((subQuestion, index) => (
            <div key={subQuestion.id} className="inline-flex min-h-[54px] w-fit items-center rounded-[7px] bg-[#f3f4f5] px-[16px] py-[7px]">
              <label className="relative inline-flex h-[40px] items-center gap-[12px] pr-[12px] text-[22px] leading-none text-[#555b61]">
                <select
                  aria-label="子题题型"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => onSubQuestionTypeChange(subQuestion.id, event.target.value as ReviewQuestionType)}
                  value={subQuestion.questionType}
                >
                  {reviewQuestionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full border border-[#7b8085] text-[22px] leading-none text-[#5c6166]">
                  {index + 1}
                </span>
                <span>{getReviewQuestionTypeLabel(subQuestion.questionType).replace('题', '')}</span>
                <ChevronDown className="h-[24px] w-[24px] stroke-[2.4] text-[#555b61]" />
              </label>
              {subQuestion.questionType === 'single_choice' || subQuestion.questionType === 'multiple_choice' ? (
                <>
                  <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
                  <CountStepper
                    label="选项数"
                    onChange={(value) => onSubQuestionOptionCountChange(subQuestion.id, value)}
                    value={subQuestion.optionCount}
                  />
                </>
              ) : null}
              {subQuestion.questionType === 'fill_blank' ? (
                <>
                  <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
                  <CountStepper
                    label="空数"
                    onChange={(value) => onSubQuestionBlankCountChange(subQuestion.id, value)}
                    value={subQuestion.blankCount}
                  />
                </>
              ) : null}
              <button
                aria-label="删除子题"
                className="ml-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#7b8085] active:bg-[#eceff1] active:text-[#d84a4a]"
                onClick={() => onDeleteSubQuestion(subQuestion.id)}
                type="button"
              >
                <Trash2 className="h-[20px] w-[20px]" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="text-[18px] leading-none text-[#9aa3ad]">问答题无需设置作答项</div>;
}

function TabletOcrQuestionReviewPage({
  boxes,
  materialPages,
  onBackToSelection,
  onExit,
  subject,
}: {
  boxes: RecognitionBox[];
  materialPages: MaterialPage[];
  onBackToSelection: () => void;
  onExit: () => void;
  subject: string;
}) {
  const initialSelectedBoxes = boxes
    .filter((box) => box.selected)
    .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y);
  const initialReviewBoxes = initialSelectedBoxes.map((box) => ({ ...box, selected: false }));
  const [globalMode, setGlobalMode] = useState<ReviewDisplayMode>('recognition');
  const [reviewBoxes, setReviewBoxes] = useState<RecognitionBox[]>(initialReviewBoxes);
  const [questions, setQuestions] = useState<ReviewQuestion[]>(() => createInitialReviewQuestions(initialSelectedBoxes, 'recognition'));
  const [activeQuestionId, setActiveQuestionId] = useState('');
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null);
  const [editingCropQuestionId, setEditingCropQuestionId] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<'idle' | 'recognizing' | 'done' | 'failed'>('idle');
  const [recognitionMessage, setRecognitionMessage] = useState('正在准备识别题型...');
  const [pendingReviewBoxIds, setPendingReviewBoxIds] = useState<Set<string>>(new Set());
  const [isReviewAddBoxMode, setIsReviewAddBoxMode] = useState(false);
  const [reviewBoxDrag, setReviewBoxDrag] = useState<{
    id: string;
    action: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startBox: RecognitionBox;
    containerRect: DOMRect;
  } | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [cropDrag, setCropDrag] = useState<{
    action: CropDragAction;
    startClientX: number;
    startClientY: number;
    startRegion: CropRegion;
  } | null>(null);
  const leftBoxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reviewPageWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const imageDisplaySizesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const hasDraggedCropRef = useRef(false);
  const hasMovedReviewBoxRef = useRef(false);
  const recognitionStartedRef = useRef(false);
  const validQuestionTypes = getValidQuestionTypes(subject || '');

  const requestAiQuestionTypes = async (questionSnapshot: ReviewQuestion[]) => {
    const response = await fetch('/api/recognize-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        croppedMode: true,
        subjectInfo: subject,
        pages: questionSnapshot.map((question, index) => ({
          pageNumber: index + 1,
          imageData: question.croppedImageData,
          width: question.croppedImageWidth || 1,
          height: question.croppedImageHeight || 1,
        })),
        userBoxes: questionSnapshot.map((question, index) => ({
          id: question.id,
          x: 0,
          y: 0,
          width: question.croppedImageWidth || 1,
          height: question.croppedImageHeight || 1,
          isSelected: true,
          pageNumber: index + 1,
          type: 'question',
        })),
        options: {
          validQuestionTypes,
        },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('AI 识别请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventText of events) {
        const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
          type?: string;
          data?: {
            message?: string;
            error?: string;
            result?: {
              matchedQuestions?: ReviewAiMatchedQuestion[];
            };
          };
        };

        if (event.type === 'progress' && event.data?.message) {
          setRecognitionMessage(event.data.message);
        }

        if (event.type === 'error') {
          throw new Error(event.data?.error || 'AI 识别失败');
        }

        if (event.type === 'complete') {
          return event.data?.result?.matchedQuestions || [];
        }
      }

      if (done) break;
    }

    return [];
  };

  useEffect(() => {
    let cancelled = false;
    const pageByNumberForCrop = new Map(materialPages.map((page) => [page.pageNumber, page]));

    async function buildCroppedImages() {
      const missingQuestions = questions.filter((question) => !question.croppedImageData);
      if (missingQuestions.length === 0) return;

      const croppedEntries = await Promise.all(missingQuestions.map(async (question) => {
        const page = pageByNumberForCrop.get(question.pageNumber);
        if (!page) return null;

        const cropped = await cropMaterialQuestionImage(page, question.crop);
        return {
          id: question.id,
          imageData: cropped.imageData,
          height: cropped.height,
          width: cropped.width,
        };
      }));

      if (cancelled) return;

      setQuestions((currentQuestions) => currentQuestions.map((question) => {
        const croppedEntry = croppedEntries.find((entry) => entry?.id === question.id);
        return croppedEntry ? {
          ...question,
          croppedImageData: croppedEntry.imageData,
          croppedImageHeight: croppedEntry.height,
          croppedImageWidth: croppedEntry.width,
        } : question;
      }));
    }

    void buildCroppedImages();

    return () => {
      cancelled = true;
    };
  }, [materialPages, questions]);

  useEffect(() => {
    if (recognitionStartedRef.current) return undefined;
    if (questions.length === 0 || questions.some((question) => !question.croppedImageData)) return undefined;

    recognitionStartedRef.current = true;
    const questionSnapshot = questions;

    async function recognizeQuestionTypes() {
      setRecognitionStatus('recognizing');
      setRecognitionMessage('AI 正在识别题型...');
      setQuestions((currentQuestions) => currentQuestions.map((question) => ({
        ...question,
        questionTypeStatus: question.questionTypeStatus === 'manual' ? 'manual' : 'pending',
      })));

      try {
        const matchedQuestions = await requestAiQuestionTypes(questionSnapshot);
        setQuestions((currentQuestions) => currentQuestions.map((question) => {
          const matchedQuestion = matchedQuestions.find((item) => item.questionBoxId === question.id);
          return applyAiQuestionType(question, matchedQuestion);
        }));
        setRecognitionStatus('done');
        setRecognitionMessage('AI 题型识别完成');
      } catch (error) {
        console.error('[TabletOCR] question type recognition failed:', error);
        setQuestions((currentQuestions) => currentQuestions.map((question) => (
          question.questionTypeStatus === 'pending' ? { ...question, questionTypeStatus: 'failed' } : question
        )));
        setRecognitionStatus('failed');
        setRecognitionMessage('AI 题型识别失败，请手动核对题型');
      }
    }

    void recognizeQuestionTypes();

    return undefined;
  }, [questions, subject]);

  useEffect(() => {
    if (!cropDrag) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const size = editingCropQuestionId ? imageDisplaySizesRef.current.get(editingCropQuestionId) : null;
      if (!size) return;

      const dx = event.clientX - cropDrag.startClientX;
      const dy = event.clientY - cropDrag.startClientY;
      const minSize = 30;
      let nextX = cropDrag.startRegion.x;
      let nextY = cropDrag.startRegion.y;
      let nextWidth = cropDrag.startRegion.width;
      let nextHeight = cropDrag.startRegion.height;

      if (Math.abs(event.clientX - cropDrag.startClientX) > 3 || Math.abs(event.clientY - cropDrag.startClientY) > 3) {
        hasDraggedCropRef.current = true;
      }

      switch (cropDrag.action) {
        case 'move':
          nextX = clampPercent(cropDrag.startRegion.x + dx, 0, size.width - nextWidth);
          nextY = clampPercent(cropDrag.startRegion.y + dy, 0, size.height - nextHeight);
          break;
        case 'resize-nw':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-ne':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-sw':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          break;
        case 'resize-se':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          break;
        case 'resize-n':
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-s':
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          break;
        case 'resize-w':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          break;
        case 'resize-e':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          break;
      }

      nextX = clampPercent(nextX, 0, size.width - minSize);
      nextY = clampPercent(nextY, 0, size.height - minSize);
      nextWidth = clampPercent(nextWidth, minSize, size.width - nextX);
      nextHeight = clampPercent(nextHeight, minSize, size.height - nextY);

      setCropRegion({
        height: Math.round(nextHeight),
        width: Math.round(nextWidth),
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
    };
    const handlePointerUp = () => setCropDrag(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [cropDrag]);

  useEffect(() => {
    if (!reviewBoxDrag) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dx = ((event.clientX - reviewBoxDrag.startClientX) / reviewBoxDrag.containerRect.width) * 100;
      const dy = ((event.clientY - reviewBoxDrag.startClientY) / reviewBoxDrag.containerRect.height) * 100;
      if (
        Math.abs(event.clientX - reviewBoxDrag.startClientX) > 3 ||
        Math.abs(event.clientY - reviewBoxDrag.startClientY) > 3
      ) {
        hasMovedReviewBoxRef.current = true;
      }

      setReviewBoxes((currentBoxes) => currentBoxes.map((box) => {
        if (box.id !== reviewBoxDrag.id) return box;

        if (reviewBoxDrag.action === 'move') {
          return {
            ...box,
            x: clampPercent(reviewBoxDrag.startBox.x + dx, 0, 100 - reviewBoxDrag.startBox.width),
            y: clampPercent(reviewBoxDrag.startBox.y + dy, 0, 100 - reviewBoxDrag.startBox.height),
          };
        }

        return {
          ...box,
          width: clampPercent(reviewBoxDrag.startBox.width + dx, 5, 100 - reviewBoxDrag.startBox.x),
          height: clampPercent(reviewBoxDrag.startBox.height + dy, 3, 100 - reviewBoxDrag.startBox.y),
        };
      }));
    };

    const handlePointerUp = () => {
      const changedBoxId = reviewBoxDrag.id;
      setReviewBoxDrag(null);
      if (hasMovedReviewBoxRef.current) {
        setReviewBoxes((currentBoxes) => currentBoxes.map((box) => (
          box.id === changedBoxId ? { ...box, selected: true } : box
        )));
        setPendingReviewBoxIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(changedBoxId);
          return nextIds;
        });
        setQuestions((currentQuestions) => currentQuestions.map((question) => (
          question.id === changedBoxId ? { ...question, questionTypeStatus: 'stale' } : question
        )));
      }
      window.setTimeout(() => {
        hasMovedReviewBoxRef.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [reviewBoxDrag]);

  const scrollLeftToQuestion = (questionId: string) => {
    window.setTimeout(() => {
      leftBoxRefs.current[questionId]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  };

  const handleSelectQuestion = (questionId: string) => {
    if (activeQuestionId === questionId) {
      setActiveQuestionId('');
      return;
    }

    setActiveQuestionId(questionId);
    scrollLeftToQuestion(questionId);
  };

  const updateQuestion = (questionId: string, updater: (question: ReviewQuestion) => ReviewQuestion) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === questionId ? updater(question) : question
    )));
  };

  const handleGlobalModeChange = (mode: ReviewDisplayMode) => {
    setGlobalMode(mode);
    setQuestions((currentQuestions) => currentQuestions.map((question) => ({ ...question, viewMode: mode })));
  };

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    setQuestions((currentQuestions) => {
      const index = currentQuestions.findIndex((question) => question.id === questionId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentQuestions.length) return currentQuestions;

      const nextQuestions = [...currentQuestions];
      const [question] = nextQuestions.splice(index, 1);
      nextQuestions.splice(targetIndex, 0, question);
      return nextQuestions;
    });
    setOpenMenuQuestionId(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((currentQuestions) => currentQuestions.filter((question) => question.id !== questionId));
    setReviewBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== questionId));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(questionId);
      return nextIds;
    });
    setOpenMenuQuestionId(null);
    if (activeQuestionId === questionId) {
      setActiveQuestionId('');
    }
  };

  const handleDeleteReviewBox = (boxId: string) => {
    const hasLinkedQuestion = questions.some((question) => question.id === boxId);
    if (hasLinkedQuestion) {
      handleDeleteQuestion(boxId);
      return;
    }

    setReviewBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== boxId));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(boxId);
      return nextIds;
    });
    setActiveQuestionId((currentId) => (currentId === boxId ? '' : currentId));
  };

  const handleToggleReviewBoxSelection = (box: RecognitionBox) => {
    const nextSelected = !box.selected;

    setReviewBoxes((currentBoxes) => currentBoxes.map((currentBox) => (
      currentBox.id === box.id ? { ...currentBox, selected: nextSelected } : currentBox
    )));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextSelected) {
        nextIds.add(box.id);
      }
      return nextIds;
    });
    setQuestions((currentQuestions) => currentQuestions.map((question) => {
      if (question.id !== box.id) return question;
      return {
        ...question,
        questionTypeStatus: pendingReviewBoxIds.has(box.id) || nextSelected ? 'stale' : 'recognized',
      };
    }));
  };

  const handleStartCrop = (question: ReviewQuestion) => {
    if (hasDraggedCropRef.current) {
      window.setTimeout(() => {
        hasDraggedCropRef.current = false;
      }, 0);
      return;
    }

    if (editingCropQuestionId === question.id) {
      handleCancelCrop();
      return;
    }

    const displaySize = imageDisplaySizesRef.current.get(question.id);
    setActiveQuestionId(question.id);
    setEditingCropQuestionId(question.id);
    setCropRegion(displaySize ? {
      height: Math.round(displaySize.height * 0.72),
      width: displaySize.width,
      x: 0,
      y: 0,
    } : null);
    scrollLeftToQuestion(question.id);
  };

  const handleCancelCrop = () => {
    setEditingCropQuestionId(null);
    setCropRegion(null);
    setCropDrag(null);
  };

  const handleConfirmCrop = async () => {
    if (!editingCropQuestionId || !cropRegion) return;
    const question = questions.find((currentQuestion) => currentQuestion.id === editingCropQuestionId);
    const displaySize = imageDisplaySizesRef.current.get(editingCropQuestionId);
    if (!question?.croppedImageData || !displaySize) return;

    const nextImageData = await cropRenderedImageRegion(question.croppedImageData, displaySize, cropRegion);
    updateQuestion(editingCropQuestionId, (currentQuestion) => ({
      ...currentQuestion,
      userCroppedImageData: nextImageData,
    }));
    handleCancelCrop();
  };

  const handleQuestionImageLoad = (questionId: string, width: number, height: number) => {
    if (!width || !height) return;
    imageDisplaySizesRef.current.set(questionId, { width, height });

    if (editingCropQuestionId === questionId && !cropRegion) {
      setCropRegion({
        height: Math.round(height * 0.72),
        width,
        x: 0,
        y: 0,
      });
    }
  };

  const startReviewBoxDrag = (
    event: ReactPointerEvent,
    box: RecognitionBox,
    action: 'move' | 'resize',
  ) => {
    const containerRect = reviewPageWrapRefs.current[box.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    hasMovedReviewBoxRef.current = false;
    setReviewBoxDrag({
      id: box.id,
      action,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBox: box,
      containerRect,
    });
  };

  const addReviewBoxAtPoint = (page: MaterialPage, clientX: number, clientY: number) => {
    const containerRect = reviewPageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    const width = 72;
    const height = 8;
    const clickX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * 100;
    const boxId = `review-manual-${Date.now()}`;

    setReviewBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: boxId,
        pageNumber: page.pageNumber,
        x: clampPercent(clickX - width / 2, 0, 100 - width),
        y: clampPercent(clickY - height / 2, 0, 100 - height),
        width,
        height,
        selected: true,
        source: 'manual',
      },
    ]);
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(boxId);
      return nextIds;
    });
    setActiveQuestionId(boxId);
  };

  const mergeRecognizedReviewQuestions = (
    currentQuestions: ReviewQuestion[],
    incomingQuestions: ReviewQuestion[],
    changedBoxIds: Set<string>,
  ) => {
    const incomingById = new Map(incomingQuestions.map((question) => [question.id, question]));
    const nextQuestions = currentQuestions.map((question) => (
      incomingById.has(question.id) ? incomingById.get(question.id)! : question
    ));
    const existingIds = new Set(nextQuestions.map((question) => question.id));
    const sortedBoxes = [...reviewBoxes].sort((firstBox, secondBox) => (
      firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y || firstBox.x - secondBox.x
    ));

    incomingQuestions.forEach((question) => {
      if (existingIds.has(question.id)) return;

      const boxOrderIndex = sortedBoxes.findIndex((box) => box.id === question.id);
      const nextExistingBox = sortedBoxes.slice(boxOrderIndex + 1).find((box) => existingIds.has(box.id));
      const insertIndex = nextExistingBox
        ? nextQuestions.findIndex((currentQuestion) => currentQuestion.id === nextExistingBox.id)
        : -1;

      if (insertIndex >= 0) {
        nextQuestions.splice(insertIndex, 0, question);
      } else {
        nextQuestions.push(question);
      }
      existingIds.add(question.id);
    });

    return nextQuestions.map((question) => (
      changedBoxIds.has(question.id) ? { ...question, viewMode: globalMode } : question
    ));
  };

  const handleContinueRecognition = async () => {
    if (pendingReviewBoxIds.size === 0 || recognitionStatus === 'recognizing') return;

    const pageByNumberForCrop = new Map(materialPages.map((page) => [page.pageNumber, page]));
    const changedBoxes = reviewBoxes
      .filter((box) => pendingReviewBoxIds.has(box.id) && box.selected)
      .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y || firstBox.x - secondBox.x);
    if (changedBoxes.length === 0) return;

    const changedBoxIds = new Set(changedBoxes.map((box) => box.id));

    setRecognitionStatus('recognizing');
    setRecognitionMessage(`AI 正在继续识别 ${changedBoxes.length} 个框...`);
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      changedBoxIds.has(question.id) ? { ...question, questionTypeStatus: 'pending' } : question
    )));

    try {
      const preparedQuestions = (await Promise.all(changedBoxes.map(async (box): Promise<ReviewQuestion | null> => {
        const page = pageByNumberForCrop.get(box.pageNumber);
        if (!page) return null;
        const cropped = await cropMaterialQuestionImage(page, box);

        return {
          id: box.id,
          pageNumber: box.pageNumber,
          crop: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          questionType: 'short_answer' as ReviewQuestionType,
          questionTypeStatus: 'pending' as QuestionTypeRecognitionStatus,
          optionCount: 4,
          blankCount: 1,
          subQuestions: [],
          viewMode: globalMode,
          croppedImageData: cropped.imageData,
          croppedImageHeight: cropped.height,
          croppedImageWidth: cropped.width,
          userCroppedImageData: undefined,
        };
      }))).filter((question): question is ReviewQuestion => Boolean(question));

      const matchedQuestions = await requestAiQuestionTypes(preparedQuestions);
      const recognizedQuestions = preparedQuestions.map((question) => (
        applyAiQuestionType(question, matchedQuestions.find((item) => item.questionBoxId === question.id))
      ));

      setQuestions((currentQuestions) => mergeRecognizedReviewQuestions(currentQuestions, recognizedQuestions, changedBoxIds));
      setReviewBoxes((currentBoxes) => currentBoxes.map((box) => (
        changedBoxIds.has(box.id) ? { ...box, selected: false } : box
      )));
      setPendingReviewBoxIds((currentIds) => {
        const nextIds = new Set(currentIds);
        changedBoxIds.forEach((boxId) => nextIds.delete(boxId));
        return nextIds;
      });
      setRecognitionStatus('done');
      setRecognitionMessage('AI 继续识别完成');
    } catch (error) {
      console.error('[TabletOCR] continue recognition failed:', error);
      setQuestions((currentQuestions) => currentQuestions.map((question) => (
        changedBoxIds.has(question.id) ? { ...question, questionTypeStatus: 'failed' } : question
      )));
      setRecognitionStatus('failed');
      setRecognitionMessage('AI 继续识别失败，请手动核对题型');
    }
  };

  const renderLeftMaterialPage = (page: MaterialPage) => {
    const frame = getMaterialPageFrameSize(page);
    const pageBoxes = reviewBoxes.filter((box) => box.pageNumber === page.pageNumber);

    return (
      <div
        key={page.pageNumber}
        className="mx-auto mb-[28px] w-fit rounded-[12px] border border-[#dfe6eb] bg-white p-[12px] shadow-[0_8px_22px_rgba(31,44,58,0.09)]"
      >
        <div
          className={`relative bg-white ${isReviewAddBoxMode ? 'cursor-crosshair' : ''}`}
          onClick={(event) => {
            if (isReviewAddBoxMode && page.role !== 'answer') {
              event.stopPropagation();
              addReviewBoxAtPoint(page, event.clientX, event.clientY);
            }
          }}
          ref={(node) => {
            reviewPageWrapRefs.current[page.pageNumber] = node;
          }}
          style={{ width: frame.width, height: frame.height }}
        >
          <img alt="" className="h-full w-full object-fill" src={page.url} />
          {pageBoxes.map((box) => {
            const isActive = box.id === activeQuestionId;
            const isPending = pendingReviewBoxIds.has(box.id);
            const isQueued = isPending && box.selected;
            const hasLinkedQuestion = questions.some((question) => question.id === box.id);
            const pendingLabel = hasLinkedQuestion ? '待重新识别' : '待识别';

            return (
              <div
                key={box.id}
                ref={(node) => {
                  leftBoxRefs.current[box.id] = node;
                }}
                className={`absolute ${
                  isActive
                    ? 'border-2 border-[#23bfb2] bg-[#ddf8f4]/38 shadow-[0_0_0_3px_rgba(35,191,178,0.18)]'
                    : isPending
                      ? 'border-2 border-[#26c9bc] bg-[#ddf8f4]/25'
                      : 'border-0 bg-[#202124]/10'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!hasMovedReviewBoxRef.current) {
                    setActiveQuestionId((currentId) => (currentId === box.id ? '' : box.id));
                  }
                }}
                onPointerDown={(event) => startReviewBoxDrag(event, box, 'move')}
                style={{
                  height: `${box.height}%`,
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                }}
              >
                <button
                  aria-label={box.selected ? '取消选中识别框' : '选中识别框'}
                  className={`absolute left-[4px] top-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border text-[13px] font-semibold leading-none shadow-[0_1px_5px_rgba(31,44,58,0.16)] ${
                    box.selected
                      ? 'border-[#26c9bc] bg-[#26c9bc] text-white'
                      : 'border-white/80 bg-[#202124]/42 text-transparent'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleReviewBoxSelection(box);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  ✓
                </button>
                {isPending ? (
                  <span className="absolute right-[32px] top-[4px] rounded-[4px] bg-[#f2a93b] px-[6px] py-[3px] text-[13px] font-medium leading-none text-white shadow-[0_1px_5px_rgba(31,44,58,0.14)]">
                    {pendingLabel}
                  </span>
                ) : null}
                <button
                  aria-label="删除识别框"
                  className="absolute right-[4px] top-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#202124]/50 text-white shadow-[0_1px_5px_rgba(31,44,58,0.16)] active:bg-[#000]"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteReviewBox(box.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  <X className="h-[13px] w-[13px]" />
                </button>
                <button
                  aria-label="调整识别框大小"
                  className="absolute bottom-[-8px] right-[-8px] h-[18px] w-[18px] rounded-full border-[2px] border-white bg-[#26c9bc] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                  onPointerDown={(event) => startReviewBoxDrag(event, box, 'resize')}
                  type="button"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRecognitionContent = (question: ReviewQuestion) => (
    <div className="rounded-[8px] border border-[#e0e5e9] bg-white p-[18px]">
      <div className="space-y-[12px]">
        <div className="h-[15px] w-[86%] rounded-full bg-[#dce4ea]" />
        <div className="h-[15px] w-[72%] rounded-full bg-[#dce4ea]" />
        <div className="h-[15px] w-[58%] rounded-full bg-[#dce4ea]" />
      </div>
      <div className="mt-[18px] rounded-[7px] bg-[#f7fafb] px-[14px] py-[12px] text-[18px] leading-none text-[#8b949e]">
        识别文本编辑区域将在下一个模式细化
      </div>
    </div>
  );

  const renderQuestionCard = (question: ReviewQuestion) => {
    const isActive = question.id === activeQuestionId;
    const isCropEditing = editingCropQuestionId === question.id;
    const questionImageData = isCropEditing
      ? question.croppedImageData
      : question.userCroppedImageData || question.croppedImageData;

    return (
      <section
        key={question.id}
        className={`relative rounded-[10px] border-[3px] bg-white shadow-[0_6px_18px_rgba(31,44,58,0.06)] ${
          isActive
            ? 'border-[#23bfb2] shadow-[0_8px_24px_rgba(35,191,178,0.18)]'
            : 'border-transparent'
        }`}
        onClick={() => handleSelectQuestion(question.id)}
      >
        <header className="flex h-[74px] items-center justify-between border-b border-[#edf0f2] px-[24px]">
          <QuestionTypeSelect
            onChange={(value) => {
              updateQuestion(question.id, (currentQuestion) => ({
                ...currentQuestion,
                questionType: value,
                questionTypeStatus: 'manual',
                subQuestions: value === 'material' && currentQuestion.subQuestions.length === 0
                  ? [{ id: `${currentQuestion.id}-sub-${Date.now()}`, questionType: 'short_answer', optionCount: 4, blankCount: 1 }]
                  : currentQuestion.subQuestions,
              }));
            }}
            status={question.questionTypeStatus}
            value={question.questionType}
          />
          <div className="flex items-center gap-[10px]">
            <StepSegmentedControl
              mode={question.viewMode}
              onChange={(value) => {
                updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, viewMode: value }));
              }}
            />
            <button
              aria-label="更多操作"
              className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f3f5f6]"
              onClick={(event) => {
                event.stopPropagation();
                setOpenMenuQuestionId(openMenuQuestionId === question.id ? null : question.id);
              }}
              type="button"
            >
              <EllipsisVertical className="h-[24px] w-[24px]" />
            </button>
            <button
              aria-label="删除题目"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-[#68727d] active:bg-[#fff1f1] active:text-[#e45454]"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteQuestion(question.id);
              }}
              type="button"
            >
              <Trash2 className="h-[22px] w-[22px]" />
            </button>
          </div>
        </header>

        {openMenuQuestionId === question.id ? (
          <div className="absolute right-[76px] top-[58px] z-20 w-[190px] overflow-hidden rounded-[10px] border border-[#dfe4e8] bg-white shadow-[0_16px_36px_rgba(31,44,58,0.18)]">
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => handleMoveQuestion(question.id, 'up')} type="button">
              <ArrowUp className="h-[20px] w-[20px]" />
              上移
            </button>
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => handleMoveQuestion(question.id, 'down')} type="button">
              <ArrowDown className="h-[20px] w-[20px]" />
              下移
            </button>
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => setOpenMenuQuestionId(null)} type="button">
              <Search className="h-[20px] w-[20px]" />
              搜相似题
            </button>
          </div>
        ) : null}

        <div className="p-[24px]">
          {question.viewMode === 'image' ? (
            <CroppedQuestionImage
              cropRegion={isCropEditing ? cropRegion : null}
              imageData={questionImageData}
              isEditing={isCropEditing}
              onClick={() => handleStartCrop(question)}
              onCropDragStart={(event, action) => {
                if (!cropRegion) return;
                event.preventDefault();
                event.stopPropagation();
                setCropDrag({
                  action,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  startRegion: cropRegion,
                });
                hasDraggedCropRef.current = false;
              }}
              onImageLoad={(width, height) => handleQuestionImageLoad(question.id, width, height)}
            />
          ) : (
            renderRecognitionContent(question)
          )}

          {isCropEditing ? (
            <div className="mt-[14px] flex justify-end gap-[12px]">
              <button
                className="h-[40px] rounded-[7px] border border-[#d7dde3] bg-white px-[18px] text-[19px] leading-none text-[#3f4852] active:bg-[#f4f6f7]"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCancelCrop();
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="inline-flex h-[40px] items-center gap-[8px] rounded-[7px] bg-[#23bfb2] px-[18px] text-[19px] font-medium leading-none text-white active:bg-[#12a99d]"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleConfirmCrop();
                }}
                type="button"
              >
                <Check className="h-[19px] w-[19px]" />
                确认裁剪
              </button>
            </div>
          ) : null}

          <div className="mt-[18px]">
            <AnswerConfigPanel
              onAddSubQuestion={(questionType) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: [
                    ...currentQuestion.subQuestions,
                    {
                      id: `${currentQuestion.id}-sub-${Date.now()}`,
                      blankCount: getDefaultBlankCount(questionType),
                      optionCount: getDefaultOptionCount(questionType),
                      questionType,
                    },
                  ],
                }));
              }}
              onBlankCountChange={(value) => {
                updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, blankCount: value }));
              }}
              onDeleteSubQuestion={(subQuestionId) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: currentQuestion.subQuestions.filter((subQuestion) => subQuestion.id !== subQuestionId),
                }));
              }}
              onOptionCountChange={(value) => {
                updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, optionCount: value }));
              }}
              onSubQuestionBlankCountChange={(subQuestionId, value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                    subQuestion.id === subQuestionId ? { ...subQuestion, blankCount: value } : subQuestion
                  )),
                }));
              }}
              onSubQuestionOptionCountChange={(subQuestionId, value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                    subQuestion.id === subQuestionId ? { ...subQuestion, optionCount: value } : subQuestion
                  )),
                }));
              }}
              onSubQuestionTypeChange={(subQuestionId, value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                    subQuestion.id === subQuestionId
                      ? {
                          ...subQuestion,
                          blankCount: value === 'fill_blank' ? Math.max(1, subQuestion.blankCount) : subQuestion.blankCount,
                          optionCount: value === 'multiple_choice' ? Math.max(4, subQuestion.optionCount) : subQuestion.optionCount,
                          questionType: value,
                        }
                      : subQuestion
                  )),
                }));
              }}
              question={question}
            />
          </div>
        </div>
      </section>
    );
  };

  const selectedPendingBoxCount = reviewBoxes.filter((box) => box.selected && pendingReviewBoxIds.has(box.id)).length;

  return (
    <div className="absolute inset-0 z-30 bg-[#eef2f5]">
      <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7eb] bg-white">
        <button
          aria-label="返回"
          className="absolute left-[28px] top-[20px] flex h-[50px] items-center gap-[6px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f3f5f6]"
          onClick={onBackToSelection}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[28px] font-semibold leading-none">核对识别结果</span>
        </button>
        <button
          className={`absolute left-[330px] top-[20px] inline-flex h-[48px] items-center gap-[8px] rounded-[8px] border px-[18px] text-[20px] font-medium leading-none ${
            isReviewAddBoxMode
              ? 'border-[#23bfb2] bg-[#e1f8f5] text-[#0f9489]'
              : 'border-[#d7dde3] bg-white text-[#202124] active:bg-[#f3f5f6]'
          }`}
          onClick={() => setIsReviewAddBoxMode((currentMode) => !currentMode)}
          type="button"
        >
          <Plus className="h-[22px] w-[22px]" />
          添加识别框
        </button>
        <div className="absolute right-[188px] top-[24px] rounded-full bg-[#e7f7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#2fac76]">
          {subject}
        </div>
        <button
          className="absolute right-[40px] top-[20px] h-[48px] rounded-[8px] bg-[#23bfb2] px-[24px] text-[20px] font-medium leading-none text-white active:bg-[#12a99d]"
          onClick={onExit}
          type="button"
        >
          加入试卷
        </button>
      </header>

      <main className="absolute bottom-0 left-0 right-0 top-[88px] flex">
        {selectedPendingBoxCount > 0 ? (
          <button
            className="absolute left-[980px] top-1/2 z-30 flex h-[82px] w-[82px] -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#23bfb2] text-[18px] font-semibold leading-[22px] text-white shadow-[0_10px_28px_rgba(35,191,178,0.36)] active:bg-[#12a99d] disabled:bg-[#b7d8d5]"
            disabled={recognitionStatus === 'recognizing'}
            onClick={() => void handleContinueRecognition()}
            type="button"
          >
            <span>继续</span>
            <span>识别</span>
          </button>
        ) : null}
        <section className="relative h-full w-[1030px] border-r border-[#dfe5ea] bg-[#f8fafb]">
          <div className="absolute inset-0 overflow-y-auto px-[28px] py-[24px]">
            {materialPages.map(renderLeftMaterialPage)}
          </div>
        </section>
        <section className="relative flex-1 bg-[#eef2f5]">
          <div className="absolute left-[28px] right-[28px] top-[24px] flex items-center justify-between">
            <StepSegmentedControl
              labels={{ recognition: '识别模式', image: '图片模式' }}
              mode={globalMode}
              onChange={handleGlobalModeChange}
            />
            <div className="flex items-center gap-[12px]">
              <span className={`rounded-full px-[18px] py-[10px] text-[19px] leading-none shadow-sm ${
                recognitionStatus === 'failed'
                  ? 'bg-[#fff4e8] text-[#b97412]'
                  : recognitionStatus === 'done'
                    ? 'bg-[#e7f7f1] text-[#2fac76]'
                    : 'bg-white text-[#68727d]'
              }`}>
                {recognitionMessage}
              </span>
              <span className="rounded-full bg-white px-[18px] py-[10px] text-[19px] leading-none text-[#68727d] shadow-sm">
                共 {questions.length} 题
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-[28px] right-[28px] top-[104px] overflow-y-auto pb-[36px]">
            {questions.length > 0 ? (
              <div className="space-y-[22px]">{questions.map(renderQuestionCard)}</div>
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-[12px] border border-dashed border-[#d7dde3] bg-white text-[22px] text-[#8b949e]">
                暂无可核对题目
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function TabletOcrContentSelectionPage({
  images,
  mode,
  onBack,
  onReplace,
  onSupplement,
  subject,
}: {
  images: SelectedImage[];
  mode: RecognitionMode | '';
  onBack: () => void;
  onReplace: () => void;
  onSupplement: () => void;
  subject: string;
}) {
  const [status, setStatus] = useState<OcrDetectStatus>('loading');
  const [materialPages, setMaterialPages] = useState<MaterialPage[]>([]);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [boxes, setBoxes] = useState<RecognitionBox[]>([]);
  const [dragState, setDragState] = useState<{
    id: string;
    action: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startBox: RecognitionBox;
    containerRect: DOMRect;
  } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [confirmAction, setConfirmAction] = useState<TabletConfirmAction>(null);
  const [dismissedEmptyPromptPages, setDismissedEmptyPromptPages] = useState<Set<number>>(new Set());
  const [isAddBoxMode, setIsAddBoxMode] = useState(false);
  const [hasSeenAddBoxModeTip, setHasSeenAddBoxModeTip] = useState(false);
  const [showAddBoxModeTip, setShowAddBoxModeTip] = useState(false);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const pageWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hasMovedBoxRef = useRef(false);
  const materialPagesRef = useRef<MaterialPage[]>([]);
  const processedImageUrlsRef = useRef<Set<string>>(new Set());
  const detectedModeRef = useRef<RecognitionMode | ''>(mode);

  useEffect(() => {
    materialPagesRef.current = materialPages;
  }, [materialPages]);

  useEffect(() => {
    let cancelled = false;

    async function runDetect() {
      const currentImageUrls = new Set(images.map((image) => image.url));
      const hasRemovedImage = Array.from(processedImageUrlsRef.current).some((url) => !currentImageUrls.has(url));
      const hasModeChanged = detectedModeRef.current !== mode;

      if (hasRemovedImage || hasModeChanged) {
        processedImageUrlsRef.current = new Set();
        materialPagesRef.current = [];
        detectedModeRef.current = mode;
        setMaterialPages([]);
        setBoxes([]);
        setHasStarted(false);
        setDismissedEmptyPromptPages(new Set());
        setIsAddBoxMode(false);
      }

      const existingPages = hasRemovedImage || hasModeChanged ? [] : materialPagesRef.current;
      const newImages = images.filter((image) => !processedImageUrlsRef.current.has(image.url));

      if (newImages.length === 0) {
        if (existingPages.length === 0) {
          setStatus('failed');
        }
        return;
      }

      const isInitialLoad = existingPages.length === 0;
      if (isInitialLoad) {
        setStatus('loading');
        setBoxes([]);
        setHasStarted(false);
        setDismissedEmptyPromptPages(new Set());
        setIsAddBoxMode(false);
      }

      try {
        const preparedPages = await prepareMaterialPages(newImages);
        if (cancelled) return;

        const pageOffset = existingPages.length;
        const newPages = preparedPages.map((page) => ({
          ...page,
          pageNumber: page.pageNumber + pageOffset,
        }));
        const pages = [...existingPages, ...newPages];
        const pagesForCut = mode === 'separate_answer'
          ? newPages.filter((page) => page.role !== 'answer')
          : newPages;

        materialPagesRef.current = pages;
        setMaterialPages(pages);
        setActivePageNumber((pagesForCut[0] || pages[0])?.pageNumber || 1);
        newImages.forEach((image) => processedImageUrlsRef.current.add(image.url));

        if (pagesForCut.length === 0) {
          setStatus(pages.length > 0 ? 'ready' : 'failed');
          return;
        }

        const detectedBoxes = (await detectMaterialBoxes(pagesForCut)).map((box) => {
          const displayPage = pagesForCut[(box.pageNumber || 1) - 1];
          const mappedBox = {
            ...box,
            pageNumber: displayPage?.pageNumber || box.pageNumber,
          };

          return expandSystemBoxForSelectIcon(mappedBox, displayPage);
        });
        if (cancelled) return;

        setBoxes((currentBoxes) => (isInitialLoad ? detectedBoxes : [...currentBoxes, ...detectedBoxes]));
        setStatus(detectedBoxes.length > 0 || pages.length > 0 ? 'ready' : 'failed');
      } catch (error) {
        if (!cancelled) {
          console.error('[TabletOCR] auto detect failed:', error);
          setStatus(isInitialLoad ? 'failed' : 'ready');
        }
      }
    }

    runDetect();

    return () => {
      cancelled = true;
    };
  }, [images, mode]);

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dx = ((event.clientX - dragState.startClientX) / dragState.containerRect.width) * 100;
      const dy = ((event.clientY - dragState.startClientY) / dragState.containerRect.height) * 100;
      if (
        Math.abs(event.clientX - dragState.startClientX) > 3 ||
        Math.abs(event.clientY - dragState.startClientY) > 3
      ) {
        hasMovedBoxRef.current = true;
      }

      setBoxes((currentBoxes) => currentBoxes.map((box) => {
        if (box.id !== dragState.id) return box;

        if (dragState.action === 'move') {
          return {
            ...box,
            x: clampPercent(dragState.startBox.x + dx, 0, 100 - dragState.startBox.width),
            y: clampPercent(dragState.startBox.y + dy, 0, 100 - dragState.startBox.height),
          };
        }

        return {
          ...box,
          width: clampPercent(dragState.startBox.width + dx, 5, 100 - dragState.startBox.x),
          height: clampPercent(dragState.startBox.height + dy, 3, 100 - dragState.startBox.y),
        };
      }));
    };

    const handlePointerUp = () => {
      setDragState(null);
      window.setTimeout(() => {
        hasMovedBoxRef.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  const activePage = materialPages.find((page) => page.pageNumber === activePageNumber) || materialPages[0];
  const questionPages = materialPages.filter((page) => page.role !== 'answer');
  const answerPages = materialPages.filter((page) => page.role === 'answer');
  const isSeparateMode = mode === 'separate_answer';
  const selectedCount = boxes.filter((box) => box.selected).length;

  const addManualBox = (targetPage = activePage?.role === 'answer' ? questionPages[0] : activePage) => {
    if (!targetPage) return;

    const pageNumber = targetPage.pageNumber;
    const samePageCount = boxes.filter((box) => box.pageNumber === pageNumber).length;

    setBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: `manual-${Date.now()}`,
        pageNumber,
        x: 10,
        y: clampPercent(10 + samePageCount * 8, 4, 74),
        width: 72,
        height: 8,
        selected: true,
        source: 'manual',
      },
    ]);
    setStatus('ready');
  };

  const addManualBoxAtPoint = (page: MaterialPage, clientX: number, clientY: number) => {
    const containerRect = pageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    const width = 72;
    const height = 8;
    const clickX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * 100;

    setBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: `manual-${Date.now()}`,
        pageNumber: page.pageNumber,
        x: clampPercent(clickX - width / 2, 0, 100 - width),
        y: clampPercent(clickY - height / 2, 0, 100 - height),
        width,
        height,
        selected: true,
        source: 'manual',
      },
    ]);
    setStatus('ready');
    setDismissedEmptyPromptPages((currentPages) => {
      const nextPages = new Set(currentPages);
      nextPages.add(page.pageNumber);
      return nextPages;
    });
  };

  const startBoxDrag = (
    event: ReactPointerEvent,
    box: RecognitionBox,
    action: 'move' | 'resize',
  ) => {
    const containerRect = (pageWrapRefs.current[box.pageNumber] || imageWrapRef.current)?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    hasMovedBoxRef.current = false;
    setDragState({
      id: box.id,
      action,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBox: box,
      containerRect,
    });
  };

  const toggleBox = (boxId: string) => {
    setBoxes((currentBoxes) => currentBoxes.map((box) => (
      box.id === boxId ? { ...box, selected: !box.selected } : box
    )));
  };

  const deleteBox = (boxId: string) => {
    setBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== boxId));
  };

  const handleReplaceClick = () => {
    if (boxes.length > 0) {
      setConfirmAction('replace');
      return;
    }

    onReplace();
  };

  const handleClearClick = () => {
    if (boxes.length > 0) {
      setConfirmAction('clear');
      return;
    }

    setBoxes([]);
  };

  const handleAddBoxModeClick = () => {
    if (!isAddBoxMode && !hasSeenAddBoxModeTip) {
      setHasSeenAddBoxModeTip(true);
      setShowAddBoxModeTip(true);
      return;
    }

    setIsAddBoxMode((currentMode) => !currentMode);
  };

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action === 'replace') {
      onReplace();
      return;
    }

    if (action === 'clear') {
      setBoxes([]);
    }
  };

  if (hasStarted) {
    return (
      <TabletOcrQuestionReviewPage
        boxes={boxes}
        materialPages={materialPages}
        onBackToSelection={() => setHasStarted(false)}
        onExit={onBack}
        subject={subject}
      />
    );
  }

  const renderMaterialPage = (page: MaterialPage, variant: 'question' | 'answer') => {
    const frame = getMaterialPageFrameSize(page);
    const pageBoxes = boxes.filter((box) => box.pageNumber === page.pageNumber);
    const isQuestionPage = variant === 'question';
    const isFirstQuestionPage = questionPages[0]?.pageNumber === page.pageNumber;

    return (
      <div
        key={page.pageNumber}
        className={`mx-auto mb-[28px] w-fit rounded-[12px] border bg-white p-[12px] shadow-[0_8px_24px_rgba(31,44,58,0.10)] ${
          isQuestionPage ? 'border-[#9edfd8]' : 'border-[#f2cf99]'
        }`}
        onClick={() => {
          if (isQuestionPage) {
            setActivePageNumber(page.pageNumber);
          }
        }}
      >
        <div
          className={`relative bg-white ${isAddBoxMode && isQuestionPage ? 'cursor-crosshair' : ''}`}
          onClick={(event) => {
            if (isAddBoxMode && isQuestionPage) {
              event.stopPropagation();
              setActivePageNumber(page.pageNumber);
              addManualBoxAtPoint(page, event.clientX, event.clientY);
            }
          }}
          ref={(node) => {
            pageWrapRefs.current[page.pageNumber] = node;
            if (page.pageNumber === activePage?.pageNumber) {
              imageWrapRef.current = node;
            }
          }}
          style={{ width: frame.width, height: frame.height }}
        >
          <img alt="" className="h-full w-full object-fill" src={page.url} />
          {isQuestionPage ? pageBoxes.map((box) => (
            <div
              key={box.id}
              className={`absolute border-2 ${
                box.selected
                  ? 'border-[#26c9bc] bg-[#ddf8f4]/25'
                  : 'border-[#9ba6b0] bg-white/30'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasMovedBoxRef.current) {
                  toggleBox(box.id);
                }
              }}
              onPointerDown={(event) => startBoxDrag(event, box, 'move')}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              <button
                aria-label={box.selected ? '取消选中识别框' : '选中识别框'}
                className={`absolute left-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-[3px] text-[12px] font-semibold leading-none text-white ${
                  box.selected ? 'bg-[#26c9bc]' : 'bg-[#9ba6b0]'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleBox(box.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                ✓
              </button>
              <button
                aria-label="删除识别框"
                className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#202124]/55 text-white active:bg-[#000]"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteBox(box.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <X className="h-[13px] w-[13px]" />
              </button>
              <button
                aria-label="调整识别框大小"
                className="absolute bottom-[-8px] right-[-8px] h-[18px] w-[18px] rounded-full border-[2px] border-white bg-[#26c9bc] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                onPointerDown={(event) => startBoxDrag(event, box, 'resize')}
                type="button"
              />
            </div>
          )) : null}
          {isQuestionPage && pageBoxes.length === 0 && isFirstQuestionPage && !dismissedEmptyPromptPages.has(page.pageNumber) ? (
            <div
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[16px] bg-white/92 px-[42px] py-[34px] shadow-[0_12px_34px_rgba(31,44,58,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                aria-label="关闭未识别提示"
                className="absolute right-[12px] top-[12px] flex h-[32px] w-[32px] items-center justify-center text-[#3f4852] active:text-[#202124]"
                onClick={() => {
                  setDismissedEmptyPromptPages((currentPages) => {
                    const nextPages = new Set(currentPages);
                    nextPages.add(page.pageNumber);
                    return nextPages;
                  });
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <X className="h-[22px] w-[22px] stroke-[2.5]" />
              </button>
              <div className="text-[24px] font-medium leading-none text-[#202124]">未识别到题目框</div>
              <button
                className="mt-[22px] h-[46px] rounded-[8px] bg-[#23bfb2] px-[24px] text-[20px] font-medium leading-none text-white active:bg-[#12a99d]"
                onClick={() => addManualBox(page)}
                type="button"
              >
                添加识别框
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderSeparateModeMaterials = () => (
    <div className="absolute inset-0 overflow-y-auto px-[28px] py-[24px]">
      <section>
        <div className="mb-[18px] flex items-center gap-[14px]">
          <span className="rounded-[6px] bg-[#e7f7ff] px-[16px] py-[8px] text-[21px] font-semibold leading-none text-[#268fe8]">
            题目图片
          </span>
          <span className="text-[19px] leading-none text-[#7a848e]">
            对题目图片框选需识别的内容
          </span>
        </div>
        {questionPages.map((page) => renderMaterialPage(page, 'question'))}
      </section>

      {answerPages.length > 0 ? (
        <section className="mt-[34px] border-t border-dashed border-[#e3bd82] pt-[28px]">
          <div className="mb-[18px] flex items-center gap-[14px]">
            <span className="rounded-[6px] bg-[#fff3dd] px-[16px] py-[8px] text-[21px] font-semibold leading-none text-[#f0a12a]">
              答案图片
            </span>
            <span className="text-[19px] leading-none text-[#9a7a45]">
              用于系统匹配答案和解析，无需框选
            </span>
          </div>
          {answerPages.map((page) => renderMaterialPage(page, 'answer'))}
        </section>
      ) : null}
    </div>
  );

  const renderUnifiedModeMaterials = () => (
    <div className="absolute inset-0 overflow-y-auto px-[28px] py-[24px]">
      {materialPages.map((page) => renderMaterialPage(page, 'question'))}
    </div>
  );

  return (
    <div className="absolute inset-0 z-30 bg-[#eef2f5]">
      <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7eb] bg-white">
        <button
          aria-label="返回"
          className="absolute left-[28px] top-[20px] flex h-[50px] items-center gap-[6px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f3f5f6]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[28px] font-semibold leading-none">识别作业资料</span>
        </button>
        <div className="absolute right-[40px] top-[24px] rounded-full bg-[#e7f7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#2fac76]">
          {subject}
        </div>
      </header>

      <div className="absolute left-0 top-[88px] h-[76px] w-full border-b border-[#e2e7eb] bg-white">
        <div className="absolute left-[34px] top-[15px] flex items-center gap-[14px]">
          <button className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7]" onClick={handleReplaceClick} type="button">
            更换资料
          </button>
          <button className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7]" onClick={onSupplement} type="button">
            补充资料
          </button>
          <button
            className={`h-[46px] rounded-[8px] border px-[20px] text-[20px] font-medium ${
              isAddBoxMode
                ? 'border-[#23bfb2] bg-[#23bfb2] text-white active:bg-[#12a99d]'
                : 'border-[#d7dde3] bg-white text-[#202124] active:bg-[#f4f6f7]'
            }`}
            onClick={handleAddBoxModeClick}
            type="button"
          >
            添加识别框
          </button>
          <button
            className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7] disabled:text-[#b8c0c8]"
            disabled={boxes.length === 0}
            onClick={handleClearClick}
            type="button"
          >
            清空
          </button>
        </div>
        <div className="absolute right-[34px] top-[28px] flex items-center gap-[18px]">
          <span className="text-[20px] leading-none text-[#68727d]">
            已选中{selectedCount}题/已框选{boxes.length}题
          </span>
        </div>
      </div>

      {status !== 'loading' && activePage ? (
        <button
          className="absolute left-[996px] top-[560px] z-20 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#23bfb2] text-center text-[20px] font-medium leading-[23px] text-white shadow-[0_12px_26px_rgba(35,191,178,0.36)] active:bg-[#12a99d] disabled:bg-[#cfd7dd] disabled:shadow-none"
          disabled={selectedCount === 0}
          onClick={() => setHasStarted(true)}
          type="button"
        >
          开始<br />识别
        </button>
      ) : null}

      <main className="absolute bottom-0 left-0 right-0 top-[164px] flex">
        <section className="relative h-full w-[1040px] border-r border-[#dfe5ea] bg-[#f8fafb]">
          {status === 'loading' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#9fa4a6]">
              <img alt="" className="h-[204px] w-[342px] object-contain" src="/tablet-ocr-loading.png" />
              <div className="mt-[28px] text-[23px] leading-none text-white">正在处理文件信息</div>
            </div>
          ) : activePage ? (
            isSeparateMode ? renderSeparateModeMaterials() : renderUnifiedModeMaterials()
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[25px] font-medium text-[#202124]">暂无可识别图片</div>
              <button className="mt-[24px] h-[48px] rounded-[8px] bg-[#23bfb2] px-[26px] text-[21px] text-white" onClick={onSupplement} type="button">
                补充资料
              </button>
            </div>
          )}
        </section>

        <section className="relative flex-1 bg-[#eef2f5]">
          <div className="absolute left-1/2 top-[116px] -translate-x-1/2">
            <StepThreeGuide mode={mode} />
          </div>
          {status === 'failed' ? (
            <div className="absolute left-1/2 top-[648px] -translate-x-1/2 rounded-full bg-[#fff8e8] px-[28px] py-[13px] text-[20px] leading-none text-[#b97412]">
              自动切题未完成，可在左侧手动添加识别框
            </div>
          ) : null}
          {hasStarted ? (
            <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 rounded-full bg-[#202124] px-[30px] py-[15px] text-[21px] leading-none text-white shadow-[0_10px_28px_rgba(31,44,58,0.2)]">
              已进入识别处理，核对结果页面待继续设计
            </div>
          ) : null}
        </section>
      </main>
      <TabletConfirmDialog
        action={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
      {showAddBoxModeTip ? (
        <AddBoxModeTipDialog onConfirm={() => setShowAddBoxModeTip(false)} />
      ) : null}
    </div>
  );
}

function AddImageDialog({
  onAlbumSelected,
  onCameraOpen,
  onClose,
}: {
  onAlbumSelected: (files: File[]) => void;
  onCameraOpen: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 z-20 bg-black/55">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />
      <section className="absolute left-[424px] top-[214px] h-[706px] w-[1072px] rounded-[20px] bg-white shadow-[0_20px_52px_rgba(0,0,0,0.24)]">
        <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#eeeeee]">
          <div className="absolute left-[48px] top-[33px] text-[30px] font-normal leading-none text-[#202124]">
            识别作业资料
          </div>
          <button
            aria-label="关闭"
            className="absolute right-[34px] top-[28px] flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#808080] active:bg-[#f2f2f2] active:text-[#222]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[34px] w-[34px] stroke-[2.2]" />
          </button>
        </header>

        <div className="absolute left-[64px] top-[154px] flex gap-[40px]">
          <SourceCard
            icon={<Images className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={() => fileInputRef.current?.click()}
            title="从相册选择"
          />
          <SourceCard
            icon={<Camera className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={onCameraOpen}
            title="拍照上传"
          />
        </div>

        <div className="absolute bottom-[80px] left-0 w-full text-center text-[22px] leading-none text-[#8a8f8c]">
          最多可添加24张图片
        </div>
      </section>
    </div>
  );
}

export function TabletAiEntryPreview() {
  const scale = useCanvasScale();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isOcrPreviewOpen, setIsOcrPreviewOpen] = useState(false);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [questionImages, setQuestionImages] = useState<SelectedImage[]>([]);
  const [answerImages, setAnswerImages] = useState<SelectedImage[]>([]);
  const [supplementSelectedImages, setSupplementSelectedImages] = useState<SelectedImage[]>([]);
  const [supplementQuestionImages, setSupplementQuestionImages] = useState<SelectedImage[]>([]);
  const [supplementAnswerImages, setSupplementAnswerImages] = useState<SelectedImage[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMode, setSelectedMode] = useState<RecognitionMode | ''>('');
  const [captureRole, setCaptureRole] = useState<ImageRole>('question');
  const [captureCloseTarget, setCaptureCloseTarget] = useState<CaptureCloseTarget>(null);
  const [userMode, setUserMode] = useState<SubjectMode>('multiple');
  const selectedImagesRef = useRef(selectedImages);
  const questionImagesRef = useRef(questionImages);
  const answerImagesRef = useRef(answerImages);
  const supplementSelectedImagesRef = useRef(supplementSelectedImages);
  const supplementQuestionImagesRef = useRef(supplementQuestionImages);
  const supplementAnswerImagesRef = useRef(supplementAnswerImages);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    questionImagesRef.current = questionImages;
  }, [questionImages]);

  useEffect(() => {
    answerImagesRef.current = answerImages;
  }, [answerImages]);

  useEffect(() => {
    supplementSelectedImagesRef.current = supplementSelectedImages;
  }, [supplementSelectedImages]);

  useEffect(() => {
    supplementQuestionImagesRef.current = supplementQuestionImages;
  }, [supplementQuestionImages]);

  useEffect(() => {
    supplementAnswerImagesRef.current = supplementAnswerImages;
  }, [supplementAnswerImages]);

  useEffect(() => () => {
    revokeImageUrls(selectedImagesRef.current);
    revokeImageUrls(questionImagesRef.current);
    revokeImageUrls(answerImagesRef.current);
    revokeImageUrls(supplementSelectedImagesRef.current);
    revokeImageUrls(supplementQuestionImagesRef.current);
    revokeImageUrls(supplementAnswerImagesRef.current);
  }, []);

  const clearSupplementImages = (shouldRevoke = true) => {
    if (shouldRevoke) {
      revokeImageUrls(supplementSelectedImagesRef.current);
      revokeImageUrls(supplementQuestionImagesRef.current);
      revokeImageUrls(supplementAnswerImagesRef.current);
    }

    setSupplementSelectedImages([]);
    setSupplementQuestionImages([]);
    setSupplementAnswerImages([]);
  };

  const handleAlbumSelected = (files: File[]) => {
    revokeImageUrls(selectedImages);
    setSelectedImages(appendFilesAsImages(files));
    setIsUploadDialogOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setIsSubjectPickerOpen(false);
    setIsModeDialogOpen(true);
  };

  const handleOpenRecognitionFlow = () => {
    clearSupplementImages();
    setIsOcrPreviewOpen(false);
    setIsCaptureOpen(false);
    setIsModeDialogOpen(false);
    setCaptureCloseTarget(null);

    if (userMode === 'single') {
      setSelectedSubject(SINGLE_SUBJECT);
      setIsSubjectPickerOpen(false);
      setIsModeDialogOpen(true);
      return;
    }

    setSelectedSubject('');
    setIsSubjectPickerOpen(true);
  };

  const handleUserModeChange = (mode: SubjectMode) => {
    setUserMode(mode);
    setIsSubjectPickerOpen(false);
    setSelectedSubject(mode === 'single' ? SINGLE_SUBJECT : '');
  };

  const handleModeSelect = (mode: RecognitionMode) => {
    clearSupplementImages();
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);
    setSelectedImages([]);
    setQuestionImages([]);
    setAnswerImages([]);
    setSelectedMode(mode);
    setIsModeDialogOpen(false);

    if (mode === 'separate_answer') {
      setCaptureRole('question');
    }

    setIsCaptureOpen(true);
    setCaptureCloseTarget('mode');
  };

  const handleOpenCamera = () => {
    clearSupplementImages();
    setIsUploadDialogOpen(false);
    setIsCaptureOpen(true);
    setCaptureCloseTarget('upload');
  };

  const isSupplementCapture = captureCloseTarget === 'content';
  const captureSelectedImages = isSupplementCapture ? supplementSelectedImages : selectedImages;
  const captureQuestionImages = isSupplementCapture ? supplementQuestionImages : questionImages;
  const captureAnswerImages = isSupplementCapture ? supplementAnswerImages : answerImages;

  const getCurrentCaptureImages = () => {
    if (selectedMode === 'separate_answer') {
      return captureRole === 'question' ? captureQuestionImages : captureAnswerImages;
    }

    return captureSelectedImages;
  };

  const handleCapture = () => {
    if (selectedMode === 'separate_answer') {
      const updater = isSupplementCapture
        ? captureRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : captureRole === 'question' ? setQuestionImages : setAnswerImages;
      const currentCount = captureRole === 'question' ? captureQuestionImages.length : captureAnswerImages.length;
      updater((currentImages) => [
        ...currentImages,
        createMockCapture(captureRole, currentCount + 1),
      ]);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => [
      ...currentImages,
      createMockCapture(undefined, currentImages.length + 1),
    ]);
  };

  const handleCaptureAlbumSelected = (files: File[]) => {
    const nextImages = appendFilesAsImages(
      files,
      selectedMode === 'separate_answer' ? captureRole : undefined,
    );

    if (selectedMode === 'separate_answer') {
      const updater = isSupplementCapture
        ? captureRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : captureRole === 'question' ? setQuestionImages : setAnswerImages;
      updater((currentImages) => [...currentImages, ...nextImages]);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => [...currentImages, ...nextImages]);
  };

  const handleDeleteCaptureImage = (image: SelectedImage, role?: ImageRole) => {
    if (selectedMode === 'separate_answer' && role) {
      const updater = isSupplementCapture
        ? role === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : role === 'question' ? setQuestionImages : setAnswerImages;
      updater((currentImages) => currentImages.filter((currentImage) => currentImage.url !== image.url));
      revokeImageUrl(image);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => currentImages.filter((currentImage) => currentImage.url !== image.url));
    revokeImageUrl(image);
  };

  const handleMoveCaptureImage = (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => {
    const fromUpdater = isSupplementCapture
      ? fromRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
      : fromRole === 'question' ? setQuestionImages : setAnswerImages;
    const toUpdater = isSupplementCapture
      ? toRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
      : toRole === 'question' ? setQuestionImages : setAnswerImages;

    fromUpdater((currentImages) => currentImages.filter((currentImage) => currentImage.url !== image.url));
    toUpdater((currentImages) => [
      ...currentImages,
      {
        ...image,
        name: image.name.replace(/^题目_/, '').replace(/^答案_/, ''),
        role: toRole,
      },
    ]);
  };

  const handleCapturePrimary = () => {
    if (selectedMode === 'separate_answer') {
      if (captureRole === 'question') {
        setCaptureRole('answer');
        return;
      }

      if (isSupplementCapture) {
        const nextImages = [...supplementQuestionImages, ...supplementAnswerImages];
        setQuestionImages((currentImages) => [...currentImages, ...supplementQuestionImages]);
        setAnswerImages((currentImages) => [...currentImages, ...supplementAnswerImages]);
        setSelectedImages((currentImages) => [...currentImages, ...nextImages]);
        clearSupplementImages(false);
      } else {
        setSelectedImages([...questionImages, ...answerImages]);
      }

      setIsCaptureOpen(false);
      setCaptureCloseTarget(null);
      setIsOcrPreviewOpen(true);
      return;
    }

    if (isSupplementCapture) {
      setSelectedImages((currentImages) => [...currentImages, ...supplementSelectedImages]);
      clearSupplementImages(false);
    }

    setIsCaptureOpen(false);
    setCaptureCloseTarget(null);
    setIsOcrPreviewOpen(true);
  };

  const handleReplaceMaterials = () => {
    clearSupplementImages();
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);
    setSelectedImages([]);
    setQuestionImages([]);
    setAnswerImages([]);
    setIsOcrPreviewOpen(false);
    setIsCaptureOpen(false);
    setIsModeDialogOpen(true);
  };

  const handleSupplementMaterials = () => {
    clearSupplementImages();
    setIsOcrPreviewOpen(true);
    setCaptureRole('question');
    setCaptureCloseTarget('content');
    setIsCaptureOpen(true);
  };

  const handleCloseCapture = () => {
    const closeTarget = captureCloseTarget;
    setIsCaptureOpen(false);
    setCaptureCloseTarget(null);

    if (closeTarget === 'mode') {
      setIsModeDialogOpen(true);
      return;
    }

    if (closeTarget === 'content') {
      clearSupplementImages();
      setIsOcrPreviewOpen(true);
      return;
    }

    if (closeTarget === 'upload') {
      setIsUploadDialogOpen(true);
    }
  };

  const currentCaptureImages = getCurrentCaptureImages();
  const captureTitle = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '拍摄题目图片'
      : '拍摄答案图片'
    : '拍摄作业资料';
  const capturePrimaryText = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '下一步：拍答案'
      : '去切题'
    : '去切题';
  const capturePrimaryDisabled = currentCaptureImages.length === 0;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#dfe2e6]">
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <div
          className="relative origin-top-left overflow-hidden bg-white"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <HomeworkPanel />
          <AiPanel
            onSubjectSelect={handleSubjectSelect}
            isSubjectPickerOpen={isSubjectPickerOpen}
            onOpenUpload={handleOpenRecognitionFlow}
            onUserModeChange={handleUserModeChange}
            selectedSubject={selectedSubject}
            userMode={userMode}
          />
          {isUploadDialogOpen ? (
            <AddImageDialog
              onAlbumSelected={handleAlbumSelected}
              onCameraOpen={handleOpenCamera}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          ) : null}
          {isModeDialogOpen ? (
            <RecognitionModeDialog
              onClose={() => setIsModeDialogOpen(false)}
              onModeSelect={handleModeSelect}
            />
          ) : null}
          {isCaptureOpen ? (
            <CaptureSimulator
              answerCount={captureAnswerImages.length}
              answerImages={captureAnswerImages}
              currentImages={currentCaptureImages}
              currentRole={selectedMode === 'separate_answer' ? captureRole : undefined}
              mode={selectedMode}
              onAlbumSelected={handleCaptureAlbumSelected}
              onCapture={handleCapture}
              onClose={handleCloseCapture}
              onDeleteImage={handleDeleteCaptureImage}
              onMoveImage={handleMoveCaptureImage}
              onPrimary={handleCapturePrimary}
              onRoleChange={setCaptureRole}
              primaryDisabled={capturePrimaryDisabled}
              primaryText={capturePrimaryText}
              questionCount={captureQuestionImages.length}
              questionImages={captureQuestionImages}
              selectedImages={captureSelectedImages}
              title={captureTitle}
            />
          ) : null}
          {isOcrPreviewOpen ? (
            <TabletOcrContentSelectionPage
              images={selectedImages}
              mode={selectedMode}
              onBack={() => setIsOcrPreviewOpen(false)}
              onReplace={handleReplaceMaterials}
              onSupplement={handleSupplementMaterials}
              subject={selectedSubject || SINGLE_SUBJECT}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
