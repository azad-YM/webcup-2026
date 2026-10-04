<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L5 (F27): translations of the main texts of municipal services, entered by agents.
 * Seeds English and Arabic names and summaries for the demonstration catalogue; the description
 * stays in French (the site falls back to French and says so).
 */
final class Version20261003123100 extends AbstractMigration
{
    /** id => [en name, en summary, ar name, ar summary] */
    private const TRANSLATIONS = [
        'etat-civil' => ['Civil registry and citizenship', 'Birth, marriage and death certificates, registration of newcomers, electoral rolls.', 'الحالة المدنية والمواطنة', 'شهادات الميلاد والزواج والوفاة، تسجيل الوافدين الجدد، القوائم الانتخابية.'],
        'sante' => ['Health', 'Medical centre, teleconsultation, vaccinations and radiation prevention.', 'الصحة', 'المركز الطبي، الاستشارة عن بُعد، التطعيمات والوقاية من الإشعاعات.'],
        'voirie-eclairage' => ['Roads and lighting', 'Maintenance of roads and walkways between the domes, street lighting, signage.', 'الطرق والإنارة', 'صيانة الطرق والممرات بين القباب، الإنارة العامة، إشارات المرور.'],
        'transports' => ['Transport', 'Shuttles between districts, self-service rovers, timetables and passes.', 'النقل', 'حافلات بين الأحياء، مركبات للخدمة الذاتية، المواعيد والاشتراكات.'],
        'eau-energie' => ['Water and energy', 'Water supply and recycling, solar grid, connections and subscriptions.', 'الماء والطاقة', 'توزيع المياه وإعادة تدويرها، الشبكة الشمسية، التوصيلات والاشتراكات.'],
        'logement' => ['Housing', 'Applying for a living module, housing support, allocation to newcomers.', 'السكن', 'طلب وحدة سكنية، مساعدات السكن، التخصيص للوافدين الجدد.'],
        'education' => ['Education and early childhood', 'Nurseries, schools, school meals and after-school activities.', 'التعليم والطفولة المبكرة', 'دور الحضانة، المدارس، المطاعم المدرسية والأنشطة بعد المدرسة.'],
        'proprete-recyclage' => ['Cleanliness and recycling', 'Waste collection and sorting, composting for the greenhouses, bulky items.', 'النظافة وإعادة التدوير', 'جمع النفايات وفرزها، التسميد للبيوت الزراعية، الأغراض الكبيرة الحجم.'],
        'hopital-nova-terra' => ['Nova Terra Hospital', 'City hospital: consultations, hospital stays, maternity and medical imaging.', 'مستشفى نوفا تيرا', 'مستشفى المدينة: استشارات، إقامة في المستشفى، الولادة والتصوير الطبي.'],
        'urgences-hopital' => ['Hospital emergency department', 'Emergency department open day and night for serious injuries and illness.', 'قسم الطوارئ في المستشفى', 'قسم الطوارئ مفتوح ليلاً ونهاراً للإصابات والوعكات الخطيرة.'],
        'pompiers' => ['Fire and rescue station', 'Fire, accident, gas leak or person in danger: firefighters respond day and night.', 'مركز الإطفاء والإنقاذ', 'حريق أو حادث أو تسرب غاز أو شخص في خطر: يتدخل رجال الإطفاء ليلاً ونهاراً.'],
        'police-municipale' => ['Police station', 'Assault, theft, immediate danger: the police answer day and night on 17.', 'مركز الشرطة', 'اعتداء أو سرقة أو خطر فوري: تجيب الشرطة ليلاً ونهاراً على الرقم 17.'],
        'pharmacie-de-garde' => ['On-duty pharmacy', 'Medicines in the evening, at night, on Sundays and public holidays.', 'صيدلية المناوبة', 'الأدوية في المساء والليل وأيام الأحد والعطل الرسمية.'],
    ];

    public function getDescription(): string
    {
        return 'L5 (F27): translations (en, ar) of the names and summaries of municipal services.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service ADD translations JSON DEFAULT NULL');
        foreach (self::TRANSLATIONS as $id => [$enName, $enSummary, $arName, $arSummary]) {
            $translations = [
                'en' => ['name' => $enName, 'summary' => $enSummary, 'description' => ''],
                'ar' => ['name' => $arName, 'summary' => $arSummary, 'description' => ''],
            ];
            $this->addSql('UPDATE municipal_service SET translations = ? WHERE id = ?', [json_encode($translations, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $id]);
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service DROP translations');
    }
}
