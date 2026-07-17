'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  CirclePlus,
  Clock3,
  FileText,
  Image as ImageIcon,
  Images,
  MessageCircle,
  Mic2,
  Minus,
  Plus,
  SendHorizonal,
  X,
} from 'lucide-react';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1200;

type SelectedImage = {
  name: string;
  url: string;
};

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
      <div className="absolute bottom-0 left-[6px] h-[10px] w-[46px] rounded-full bg-[#d8f2e8]" />
      <div className="absolute left-[9px] top-[8px] h-[38px] w-[43px] rounded-[10px] bg-[#009a65] shadow-sm">
        <div className="absolute -top-[10px] left-[18px] h-[13px] w-[5px] rounded-full bg-[#6bd28f]" />
        <div className="absolute -top-[15px] left-[14px] h-[8px] w-[8px] rounded-full bg-[#72d885]" />
        <div className="absolute left-[9px] top-[12px] h-[9px] w-[7px] rounded-[3px] bg-[#b8f5dd]" />
        <div className="absolute right-[9px] top-[12px] h-[9px] w-[7px] rounded-[3px] bg-[#b8f5dd]" />
        <div className="absolute bottom-[8px] left-[15px] h-[3px] w-[13px] rounded-full bg-[#b8f5dd]" />
      </div>
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

function AiPanel({ onOpenUpload }: { onOpenUpload: () => void }) {
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

      <QuickButton top={279}>帮我布置试卷作业</QuickButton>
      <QuickButton top={357} onClick={onOpenUpload}>
        帮我识别作业资料
      </QuickButton>
      <QuickButton top={430}>帮我布置听力作业</QuickButton>

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

function AddSourceCard({
  icon,
  compact = false,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  compact?: boolean;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex flex-col items-center justify-center rounded-[14px] bg-[#f8f9f9] text-center shadow-[0_8px_24px_rgba(20,44,35,0.05)] active:scale-[0.99] active:bg-[#f2f7f5] ${
        compact ? 'h-[150px] w-[230px]' : 'h-[286px] w-[428px]'
      }`}
      onClick={onClick}
      type="button"
    >
      <div
        className={`flex items-center justify-center rounded-[18px] bg-white text-[#49bf89] shadow-[0_6px_18px_rgba(20,44,35,0.08)] ${
          compact ? 'h-[58px] w-[58px]' : 'h-[78px] w-[78px]'
        }`}
      >
        {icon}
      </div>
      <div
        className={`font-medium leading-none text-[#202124] ${
          compact ? 'mt-[18px] text-[22px]' : 'mt-[30px] text-[30px]'
        }`}
      >
        {title}
      </div>
    </button>
  );
}

function StepNav() {
  const steps = ['添加资料', '选择识别方式', '选择识别内容', '检查结果'];

  return (
    <div className="flex items-center gap-[22px]">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-[22px]">
          <div
            className={`text-[20px] leading-none ${
              index === 0 ? 'font-medium text-[#24b77c]' : 'text-[#9a9a9a]'
            }`}
          >
            {step}
          </div>
          {index < steps.length - 1 ? (
            <div className="h-[1px] w-[38px] bg-[#e5e5e5]" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ImageTile({ image, index }: { image: SelectedImage; index: number }) {
  return (
    <div className="relative h-[126px] overflow-hidden rounded-[10px] bg-[#f4f4f4]">
      <img alt="" className="h-full w-full object-cover" src={image.url} />
      <div className="absolute left-[8px] top-[8px] rounded-full bg-black/48 px-[9px] py-[4px] text-[15px] leading-none text-white">
        {index + 1}
      </div>
    </div>
  );
}

function AddMaterialStepDialog({
  onAlbumSelected,
  onClose,
  selectedImages,
  selectedSubject,
  onSubjectChange,
}: {
  onAlbumSelected: (files: File[]) => void;
  onClose: () => void;
  selectedImages: SelectedImage[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canContinue = selectedImages.length > 0 && selectedSubject.length > 0;

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
      <section className="absolute left-[330px] top-[154px] h-[884px] w-[1260px] rounded-[18px] bg-white shadow-[0_20px_52px_rgba(0,0,0,0.24)]">
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

        <div className="absolute left-[48px] top-[123px]">
          <StepNav />
        </div>

        <div className="absolute left-[48px] top-[180px] h-[574px] w-[700px]">
          <div className="flex items-center justify-between">
            <div className="text-[26px] font-medium leading-none text-[#202124]">
              添加资料
            </div>
            <div className="text-[20px] leading-none text-[#8a8f8c]">
              最多可添加24张图片
            </div>
          </div>

          <div className="mt-[22px] flex gap-[22px]">
            <AddSourceCard
              compact
              icon={<Images className="h-[32px] w-[32px] stroke-[1.9]" />}
              onClick={() => fileInputRef.current?.click()}
              title="从相册选择"
            />
            <AddSourceCard
              compact
              icon={<Camera className="h-[32px] w-[32px] stroke-[1.9]" />}
              title="拍照上传"
            />
          </div>

          <div className="mt-[34px] flex items-center justify-between">
            <div className="text-[24px] font-medium leading-none text-[#202124]">
              已添加图片
            </div>
            {selectedImages.length > 0 ? (
              <button
                className="text-[20px] leading-none text-[#42bf86] active:text-[#219b66]"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                继续添加
              </button>
            ) : null}
          </div>

          {selectedImages.length > 0 ? (
            <div className="mt-[18px] grid max-h-[264px] grid-cols-4 gap-[14px] overflow-hidden">
              {selectedImages.slice(0, 8).map((image, index) => (
                <ImageTile key={image.url} image={image} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-[18px] flex h-[264px] items-center justify-center rounded-[12px] bg-[#f7f8f8] text-[22px] leading-none text-[#a0a5a2]">
              请选择或拍摄需要识别的图片
            </div>
          )}

          {selectedImages.length > 8 ? (
            <div className="mt-[12px] text-right text-[19px] leading-none text-[#8a8f8c]">
              另有 {selectedImages.length - 8} 张图片
            </div>
          ) : null}
        </div>

        <div className="absolute left-[804px] top-[180px] h-[574px] w-[408px]">
          <div className="text-[26px] font-medium leading-none text-[#202124]">
            选择学科
          </div>
          <div className="mt-[24px] grid grid-cols-2 gap-[14px]">
            {subjects.map((subject) => {
              const isSelected = selectedSubject === subject;

              return (
                <button
                  key={subject}
                  className={`h-[58px] rounded-[8px] border text-[21px] leading-none ${
                    isSelected
                      ? 'border-[#58cf9a] bg-[#eefaf4] text-[#23a872]'
                      : 'border-[#e1e1e1] bg-white text-[#333]'
                  }`}
                  onClick={() => onSubjectChange(subject)}
                  type="button"
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 h-[102px] w-full border-t border-[#eeeeee]">
          <button
            className="absolute bottom-[26px] right-[196px] h-[50px] w-[112px] rounded-[6px] border border-[#d7d7d7] bg-white text-[22px] leading-none text-[#555] active:bg-[#f6f6f6]"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className={`absolute bottom-[26px] right-[48px] h-[50px] w-[124px] rounded-[6px] text-[22px] leading-none text-white ${
              canContinue ? 'bg-[#58cf9a] active:bg-[#45bf89]' : 'bg-[#c7c7c7]'
            }`}
            disabled={!canContinue}
            type="button"
          >
            下一步
          </button>
        </footer>
      </section>
    </div>
  );
}

export function TabletAiEntryPreview() {
  const scale = useCanvasScale();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const imageUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleAlbumSelected = (files: File[]) => {
    setSelectedImages((currentImages) => {
      const remainingCount = Math.max(24 - currentImages.length, 0);
      const newImages = files.slice(0, remainingCount).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));

      imageUrlsRef.current.push(...newImages.map((image) => image.url));
      return [...currentImages, ...newImages];
    });
  };

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
          <AiPanel onOpenUpload={() => setIsUploadDialogOpen(true)} />
          {isUploadDialogOpen ? (
            <AddMaterialStepDialog
              onAlbumSelected={handleAlbumSelected}
              onClose={() => setIsUploadDialogOpen(false)}
              onSubjectChange={setSelectedSubject}
              selectedImages={selectedImages}
              selectedSubject={selectedSubject}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
