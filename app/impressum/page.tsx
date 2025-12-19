import Link from 'next/link';
import { BackButton } from '@/components/BackButton';
import { ObfuscatedMail } from '@/components/ObfuscatedMail';

export default function ImpressumPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors text-sm font-semibold tracking-wide uppercase">
                    <span className="mr-2">←</span> Zurück zur Startseite
                </Link>

                <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden border border-slate-100 p-8 sm:p-12">
                    <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Impressum</h1>

                    <div className="prose prose-slate prose-lg max-w-none">
                        <p>
                            <strong>Verantwortlich für den Inhalt dieser Website gemäß § 55 II RStV:</strong>
                        </p>
                        <p>
                            Wolfgang Stefani<br />
                            Mareschstraße 4<br />
                            12055 Berlin<br />
                            <ObfuscatedMail user="info" domain="wolfgegenlicht.de" className="hover:text-indigo-600 transition-colors" /><br />
                            Tel. +49 030 49 871 398
                        </p>

                        <p>
                            <strong>Umsatzsteuer-ID:</strong><br />
                            Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: DE324879573
                        </p>

                        <p>
                            <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
                            Wolfgang Stefani (Anschrift siehe oben)
                        </p>

                        <hr className="my-8 border-slate-100" />

                        <p>
                            <strong>Hinweis nach §36 VSBG</strong><br />
                            Wolfgang Stefani ist weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Plattform der EU-Kommission zur Online-Streitbeilegung: <a href="https://www.ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://www.ec.europa.eu/consumers/odr</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
