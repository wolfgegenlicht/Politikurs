export default function PollDetailLoading() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto">
                {/* Back Button Skeleton */}
                <div className="w-32 h-6 bg-slate-200 rounded-full mb-8 animate-pulse" />

                {/* Main Card Skeleton */}
                <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden mb-8 border border-slate-200">
                    <div className="p-4 sm:p-12">
                        {/* Header Badge & Date */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-32 h-8 bg-slate-100 rounded-full animate-pulse" />
                            <div className="w-24 h-5 bg-slate-100 rounded-full animate-pulse" />
                        </div>

                        {/* Title Skeleton (H1) */}
                        <div className="space-y-3 mb-8">
                            <div className="w-full h-10 bg-slate-200 rounded-xl animate-pulse" />
                            <div className="w-3/4 h-10 bg-slate-200 rounded-xl animate-pulse" />
                        </div>

                        {/* Question Badge Skeleton (H2) */}
                        <div className="mb-6">
                            <div className="w-1/2 h-8 bg-indigo-50 rounded-xl animate-pulse" />
                        </div>

                        {/* Original Title Box Skeleton */}
                        <div className="mb-10 pt-6 border-t border-slate-100">
                            <div className="w-20 h-3 bg-slate-100 rounded mb-2 animate-pulse" />
                            <div className="w-full h-5 bg-slate-50 rounded animate-pulse" />
                        </div>

                        {/* Voting Interface Skeleton */}
                        <div className="grid grid-cols-2 gap-6 pt-6">
                            <div className="aspect-square bg-slate-50 rounded-[2rem] border-2 border-slate-100 animate-pulse flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full" />
                                <div className="w-12 h-4 bg-slate-200 rounded-full" />
                            </div>
                            <div className="aspect-square bg-slate-50 rounded-[2rem] border-2 border-slate-100 animate-pulse flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full" />
                                <div className="w-12 h-4 bg-slate-200 rounded-full" />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <div className="w-48 h-10 bg-slate-100 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Background Loading Placeholder */}
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200">
                    <div className="w-32 h-6 bg-slate-200 rounded mb-6 animate-pulse" />
                    <div className="space-y-4">
                        <div className="w-full h-4 bg-slate-100 rounded animate-pulse" />
                        <div className="w-full h-4 bg-slate-100 rounded animate-pulse" />
                        <div className="w-2/3 h-4 bg-slate-100 rounded animate-pulse" />
                    </div>
                </div>

                {/* Footer Skeleton */}
                <div className="mt-12 py-8 border-t border-slate-200 flex flex-col items-center gap-4">
                    <div className="w-24 h-6 bg-slate-100 rounded animate-pulse" />
                    <div className="w-48 h-4 bg-slate-50 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}
