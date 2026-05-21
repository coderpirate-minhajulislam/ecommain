import { Head, usePage } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import { Users } from 'lucide-react';
import { ShopLayout } from '@/components/ecommerce/shop-layout';
import { Card, CardContent } from '@/components/ui/card';

type AboutProps = {
    heroTitle: string;
    heroSubtitle: string;
    storyHeading: string;
    storyPara1: string;
    storyPara2: string;
    missionTitle: string;
    missionText: string;
    stats: { value: string; label: string }[];
    values: { icon: string; title: string; description: string }[];
    team: { name: string; role: string; avatar: string }[];
};

export default function About() {
    const { heroTitle, heroSubtitle, storyHeading, storyPara1, storyPara2, missionTitle, missionText, stats, values, team } =
        usePage<AboutProps>().props;

    return (
        <>
            <Head title="About Us" />
            <ShopLayout>
                {/* Hero */}
                <div className="mb-10 text-center">
                    <h1 className="mb-3 text-3xl font-bold md:text-4xl">{heroTitle}</h1>
                    <p className="mx-auto max-w-2xl text-muted-foreground">{heroSubtitle}</p>
                </div>

                {/* Our Story */}
                <div className="mb-12 rounded-xl bg-muted/30 p-6 md:p-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="mb-4 text-2xl font-bold">{storyHeading}</h2>
                        <p className="mb-4 text-muted-foreground">{storyPara1}</p>
                        <p className="text-muted-foreground">{storyPara2}</p>
                    </div>
                </div>

                {/* Stats */}
                {stats && stats.length > 0 && (
                    <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {stats.map((stat) => (
                            <Card key={stat.label} className="text-center">
                                <CardContent className="p-6">
                                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Values */}
                {values && values.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-center text-2xl font-bold">Our Values</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {values.map((item, i) => {
                                const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon];

                                return (
                                    <Card key={i}>
                                        <CardContent className="p-6 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                {Icon && <Icon className="h-6 w-6" />}
                                            </div>
                                            <h3 className="mb-2 font-semibold">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Team */}
                {team && team.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-center text-2xl font-bold">Meet Our Team</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {team.map((member, i) => (
                                <Card key={i}>
                                    <CardContent className="p-6 text-center">
                                        {member.avatar && member.avatar.startsWith('/') ? (
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
                                                {member.avatar || '👤'}
                                            </div>
                                        )}
                                        <h3 className="font-semibold">{member.name}</h3>
                                        <p className="text-sm text-muted-foreground">{member.role}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mission */}
                <div className="rounded-xl bg-primary p-6 text-center text-primary-foreground md:p-10">
                    <Users className="mx-auto mb-4 h-10 w-10" />
                    <h2 className="mb-3 text-2xl font-bold">{missionTitle}</h2>
                    <p className="mx-auto max-w-2xl text-primary-foreground/80">{missionText}</p>
                </div>
            </ShopLayout>
        </>
    );
}
